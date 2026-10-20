import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HiOutlineLink,
  HiOutlinePhotograph,
  HiOutlineEye,
  HiOutlineCode,
  HiOutlineSparkles,
  HiOutlineVideoCamera,
  HiOutlineTable,
} from 'react-icons/hi';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatClear,
  MdUndo,
  MdRedo,
  MdHorizontalRule,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

const LUXURY_COLORS = [
  { name: 'Charcoal', hex: '#1c1917' },
  { name: 'Warm Gold', hex: '#b58838' },
  { name: 'Deep Bronze', hex: '#8b6f4e' },
  { name: 'Burgundy', hex: '#881337' },
  { name: 'Emerald', hex: '#065f46' },
  { name: 'Sapphire', hex: '#1e3a8a' },
  { name: 'Muted Slate', hex: '#64748b' },
];

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write your rich luxury blog content here...',
  minHeight = '320px',
  onApplyReadTime,
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [savedSelection, setSavedSelection] = useState(null);

  // Sync internal state when external value changes while not typing
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setHtmlContent(value || '');
  }, [value, isHtmlMode]);

  // Calculate words and read time
  const plainText = (htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const estimatedMins = Math.max(1, Math.ceil(wordCount / 200));
  const readTimeString = `${estimatedMins} min read`;

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        setSavedSelection(sel.getRangeAt(0));
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelection && window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }
  };

  const exec = (command, val = null) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setHtmlContent(html);
    onChange?.(html);
  }, [onChange]);

  const handleHtmlAreaChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    onChange?.(newHtml);
  };

  const toggleHtmlMode = () => {
    if (!isHtmlMode) {
      // Switching to HTML mode
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
      setIsHtmlMode(true);
    } else {
      // Switching back to visual mode
      setIsHtmlMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlContent;
        }
      }, 0);
    }
  };

  const handleFormatBlock = (tag) => {
    if (isHtmlMode) return;
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else if (tag === 'blockquote') {
      exec('formatBlock', '<blockquote>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const openLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection()?.toString() || '';
    setLinkText(sel);
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl) {
      toast.error('Please enter a URL');
      return;
    }
    restoreSelection();
    const safeUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('/')
      ? linkUrl
      : `https://${linkUrl}`;

    if (linkText && (!savedSelection || savedSelection.collapsed)) {
      exec('insertHTML', `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#8b6f4e; text-decoration:underline;">${linkText}</a>`);
    } else {
      exec('createLink', safeUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('Please enter an image URL');
      return;
    }
    restoreSelection();
    const imgHtml = `<figure style="margin: 1.5rem 0; text-align: center;"><img src="${imageUrl}" alt="${imageAlt || 'Blog image'}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin: 0 auto; display: block;" />${imageAlt ? `<figcaption style="margin-top: 0.5rem; font-size: 0.85rem; color: #78716c; font-style: italic;">${imageAlt}</figcaption>` : ''}</figure><p><br></p>`;
    exec('insertHTML', imgHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const loadingToast = toast.loading('Uploading image to cloud storage...');
      const uploaded = await uploadWithPresignedUrl(file, 'blog');
      toast.dismiss(loadingToast);

      if (uploaded?.url) {
        editorRef.current?.focus();
        const imgHtml = `<figure style="margin: 1.5rem 0; text-align: center;"><img src="${uploaded.url}" alt="${file.name.replace(/\.[^/.]+$/, '')}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin: 0 auto; display: block;" /></figure><p><br></p>`;
        exec('insertHTML', imgHtml);
        toast.success('Image uploaded and inserted into article!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInsertTable = () => {
    if (isHtmlMode) return;
    restoreSelection();
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem;"><thead><tr style="background: #faf6f0; border-bottom: 2px solid #e8ddce; text-align: left;"><th style="padding: 10px 14px; font-weight: 600; color: #785327;">Specification</th><th style="padding: 10px 14px; font-weight: 600; color: #785327;">Recommended Care</th></tr></thead><tbody><tr style="border-bottom: 1px solid #f0eae1;"><td style="padding: 10px 14px; color: #44403c;">18K Solid Gold</td><td style="padding: 10px 14px; color: #44403c;">Warm soapy water soak</td></tr><tr style="border-bottom: 1px solid #f0eae1;"><td style="padding: 10px 14px; color: #44403c;">Natural Diamonds</td><td style="padding: 10px 14px; color: #44403c;">Gentle ultrasonic or soft brush</td></tr></tbody></table><p><br></p>`;
    exec('insertHTML', tableHtml);
    toast.success('Inserted care guide table');
  };

  const handleInsertMedia = () => {
    if (isHtmlMode) return;
    const url = prompt('Enter Video or Embed URL (YouTube or MP4):');
    if (!url) return;
    restoreSelection();
    let videoHtml = '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const vidId = url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : url.split('/').pop();
      videoHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1.5rem 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"><iframe src="https://www.youtube.com/embed/${vidId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe></div><p><br></p>`;
    } else {
      videoHtml = `<video controls style="width: 100%; max-height: 400px; border-radius: 12px; margin: 1.5rem 0;"><source src="${url}" type="video/mp4" /></video><p><br></p>`;
    }
    exec('insertHTML', videoHtml);
    toast.success('Video embedded!');
  };

  const handleInsertCallout = () => {
    if (isHtmlMode) return;
    restoreSelection();
    const quoteHtml = `<blockquote style="display: flex; gap: 12px; align-items: flex-start; padding: 16px 20px; background: #faf5ee; border-left: 4px solid #8b6f4e; border-radius: 12px; margin: 20px 0; color: #785327;"><span style="font-size: 18px; line-height: 1;">💡</span><span style="font-size: 0.95rem; line-height: 1.5;">Store each piece in its individual velvet Neirah box to prevent delicate metals from coming into contact with one another.</span></blockquote><p><br></p>`;
    exec('insertHTML', quoteHtml);
    toast.success('Inserted callout note');
  };

  return (
    <div className="w-full border border-stone-200/90 rounded-2xl bg-white overflow-hidden shadow-xs focus-within:border-[#8b6f4e] transition-colors">
      {/* ─── Premium Luxury Toolbar ─── */}
      <div className="bg-[#fcfaf7] border-b border-stone-200/80 px-3 py-2 flex flex-wrap items-center gap-1.5 text-stone-700 select-none">
        {/* Style Dropdown */}
        <select
          title="Format Block"
          disabled={isHtmlMode}
          onChange={(e) => {
            handleFormatBlock(e.target.value);
            e.target.value = '';
          }}
          defaultValue=""
          className="h-8 px-2.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e] cursor-pointer disabled:opacity-40"
        >
          <option value="" disabled>Paragraph</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote Callout</option>
        </select>

        <div className="w-[1px] h-4 bg-stone-200 mx-1" />

        {/* Inline Formatting */}
        <button
          type="button"
          title="Bold (Ctrl+B)"
          disabled={isHtmlMode}
          onClick={() => exec('bold')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatBold className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Italic (Ctrl+I)"
          disabled={isHtmlMode}
          onClick={() => exec('italic')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatItalic className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Underline (Ctrl+U)"
          disabled={isHtmlMode}
          onClick={() => exec('underline')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatUnderlined className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Strikethrough"
          disabled={isHtmlMode}
          onClick={() => exec('strikeThrough')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdStrikethroughS className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          title="Align Left"
          disabled={isHtmlMode}
          onClick={() => exec('justifyLeft')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatAlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Align Center"
          disabled={isHtmlMode}
          onClick={() => exec('justifyCenter')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatAlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Align Right"
          disabled={isHtmlMode}
          onClick={() => exec('justifyRight')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatAlignRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 mx-1" />

        {/* Lists & Quote */}
        <button
          type="button"
          title="Numbered List"
          disabled={isHtmlMode}
          onClick={() => exec('insertOrderedList')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatListNumbered className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Bulleted List"
          disabled={isHtmlMode}
          onClick={() => exec('insertUnorderedList')}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatListBulleted className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 mx-1" />

        {/* Links, Images, Media, Table, Quote */}
        <button
          type="button"
          title="Insert Link"
          disabled={isHtmlMode}
          onClick={openLinkDialog}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <HiOutlineLink className="w-4 h-4" />
        </button>

        {/* Image upload button */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          title="Upload or Insert Image"
          disabled={isHtmlMode || uploadingImage}
          onClick={() => setShowImageModal(true)}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <HiOutlinePhotograph className={`w-4 h-4 ${uploadingImage ? 'animate-spin text-[#8b6f4e]' : ''}`} />
        </button>

        {/* Media / Video */}
        <button
          type="button"
          title="Embed Video / Media"
          disabled={isHtmlMode}
          onClick={handleInsertMedia}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <HiOutlineVideoCamera className="w-4 h-4" />
        </button>

        {/* Table */}
        <button
          type="button"
          title="Insert Table"
          disabled={isHtmlMode}
          onClick={handleInsertTable}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <HiOutlineTable className="w-4 h-4" />
        </button>

        {/* Callout Quote */}
        <button
          type="button"
          title="Callout Box"
          disabled={isHtmlMode}
          onClick={handleInsertCallout}
          className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-200/70 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
        >
          <MdFormatQuote className="w-4 h-4" />
        </button>

        {/* Mode Toggle: Visual vs HTML Source */}
        <button
          type="button"
          title={isHtmlMode ? 'Switch to Visual Editor' : 'Switch to HTML Code View'}
          onClick={toggleHtmlMode}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
            isHtmlMode
              ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-2xs'
              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs'
          }`}
        >
          {isHtmlMode ? (
            <>
              <HiOutlineEye className="w-3.5 h-3.5" />
              <span>Visual</span>
            </>
          ) : (
            <>
              <span className="font-mono text-xs font-bold text-stone-500">&lt;/&gt;</span>
              <span>HTML</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Content Area ─── */}
      <div className="relative p-4 bg-white" style={{ minHeight }}>
        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlAreaChange}
            placeholder="<p>Write raw HTML markup here...</p>"
            className="w-full h-full min-h-[300px] p-3 font-mono text-xs text-stone-800 bg-stone-50/70 border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] resize-y leading-relaxed"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            data-placeholder={placeholder}
            className="rich-editor-content w-full h-full min-h-[300px] text-sm text-stone-800 leading-relaxed outline-none prose prose-stone max-w-none focus:outline-none"
            style={{
              outline: 'none',
              wordBreak: 'break-word',
            }}
          />
        )}
      </div>

      {/* ─── Metrics & Read-Time Footer ─── */}
      <div className="px-4 py-2 border-t border-stone-100 bg-[#faf8f5] flex flex-wrap items-center justify-between text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-4">
          <span>
            Words: <strong className="text-stone-800">{wordCount}</strong>
          </span>
          <span>
            Read Time: <strong className="text-[#8b6f4e]">{readTimeString}</strong>
          </span>
        </div>

        {onApplyReadTime && (
          <button
            type="button"
            onClick={() => onApplyReadTime(readTimeString)}
            className="flex items-center gap-1.5 text-xs text-[#8b6f4e] hover:text-[#725a3f] font-semibold hover:underline cursor-pointer"
          >
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            <span>Apply to Read Time field</span>
          </button>
        )}
      </div>

      {/* ─── Insert Link Modal ─── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp">
            <h4 className="font-bold text-sm text-stone-900">Insert Link</h4>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Link URL</label>
              <input
                type="url"
                autoFocus
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Display Text (optional)</label>
              <input
                type="text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 text-xs font-semibold bg-[#8b6f4e] text-white rounded-lg hover:bg-[#785e40] cursor-pointer"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Insert Image Modal ─── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp">
            <h4 className="font-bold text-sm text-stone-900">Insert Article Image</h4>

            {/* Upload Option */}
            <div className="p-4 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50 text-center space-y-2">
              <HiOutlinePhotograph className="w-8 h-8 text-[#8b6f4e] mx-auto" />
              <p className="text-xs font-semibold text-stone-700">Upload Image File</p>
              <p className="text-[11px] text-stone-500">PNG, JPG, WEBP up to 10MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-stone-300 text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-100 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                Choose Local File
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-[1px] bg-stone-200" />
              <span className="text-[10px] uppercase font-bold text-stone-400">or via URL</span>
              <div className="flex-1 h-[1px] bg-stone-200" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Image Web URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Caption / Alt text (optional)</label>
              <input
                type="text"
                placeholder="Exquisite 18K Solitaire Ring"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImageUrl}
                className="px-4 py-1.5 text-xs font-semibold bg-[#8b6f4e] text-white rounded-lg hover:bg-[#785e40] cursor-pointer"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for contentEditable styling */}
      <style>{`
        .rich-editor-content:empty:before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
        }
        .rich-editor-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1c1917;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .rich-editor-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1c1917;
          margin-top: 1.15rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        .rich-editor-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #292524;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .rich-editor-content h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #44403c;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .rich-editor-content p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .rich-editor-content blockquote {
          border-left: 3px solid #8b6f4e;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #57534e;
          background: #faf8f5;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 8px 8px 0;
        }
        .rich-editor-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .rich-editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .rich-editor-content li {
          margin-bottom: 0.25rem;
        }
        .rich-editor-content hr {
          border: none;
          border-top: 1px solid #e7e5e4;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
