import React from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineLink,
} from 'react-icons/hi';
import { TbListDetails } from 'react-icons/tb';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function Step5CareAndSpecs() {
  const {
    careSections,
    handleAddCareSection,
    handleCareDragStart,
    handleCareDragOver,
    handleCareDrop,
    handleCareDragEnd,
    draggedCareIndex,
    dragOverCareIndex,
    handleMoveCareSection,
    handleUpdateCareSection,
    handleRemoveCareSection,
    handleFormatText,
    handleKeyDownDescription,
    specifications,
    handleAddSpecification,
    handleMoveSpecification,
    handleUpdateSpecification,
    handleRemoveSpecification,
  } = useAddJewelryProductContext();

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sub-block A: Product Information & Care Sections */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
              <HiOutlineDocumentText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Product Information & Care Sections
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                  {careSections.length} Added
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCareSection}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Section</span>
          </button>
        </div>

        {careSections.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5]">
            <p className="text-xs text-stone-500 font-medium">
              No custom header & description sections added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {careSections.map((sec, idx) => (
              <div
                key={sec.id}
                draggable
                onDragStart={(e) => handleCareDragStart(e, idx)}
                onDragOver={(e) => handleCareDragOver(e, idx)}
                onDrop={(e) => handleCareDrop(e, idx)}
                onDragEnd={handleCareDragEnd}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 space-y-3 relative shadow-2xs ${
                  draggedCareIndex === idx
                    ? 'opacity-40 border-dashed border-[#8b6f4e] bg-stone-100 scale-[0.99]'
                    : dragOverCareIndex === idx
                    ? 'border-2 border-[#8b6f4e] bg-[#faf5ee] shadow-md'
                    : 'border-stone-200/90 bg-[#faf8f5]'
                }`}
              >
                {/* Top Header Row */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  {/* Grip Handle & Up/Down Buttons */}
                  <div className="flex items-center gap-1 shrink-0 bg-white border border-stone-200/90 px-1.5 py-1 rounded-xl shadow-2xs">
                    {/* 6-dots Grip Handle */}
                    <div
                      title="Drag to reorder section"
                      className="text-stone-400 hover:text-[#8b6f4e] cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <circle cx="7" cy="5" r="1.5" />
                        <circle cx="13" cy="5" r="1.5" />
                        <circle cx="7" cy="10" r="1.5" />
                        <circle cx="13" cy="10" r="1.5" />
                        <circle cx="7" cy="15" r="1.5" />
                        <circle cx="13" cy="15" r="1.5" />
                      </svg>
                    </div>

                    {/* Quick Up/Down Buttons */}
                    <div className="flex flex-col -space-y-0.5 pl-1 border-l border-stone-200">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCareSection(idx, -1);
                        }}
                        title="Move section up"
                        className="w-5 h-4 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] hover:bg-stone-100 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={idx === careSections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCareSection(idx, 1);
                        }}
                        title="Move section down"
                        className="w-5 h-4 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] hover:bg-stone-100 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Title Input */}
                  <input
                    type="text"
                    value={sec.header}
                    onChange={(e) =>
                      handleUpdateCareSection(sec.id, 'header', e.target.value)
                    }
                    placeholder='Section Title (e.g. "Care Instructions", "Packaging")'
                    className="flex-1 min-w-[200px] h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                  />

                  {/* Right Controls: Show on Product Page Switch & Delete Button */}
                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    {/* Show on Product Page Switch */}
                    <div className="flex items-center gap-2 select-none">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sec.showOnProductPage !== false}
                        onClick={() =>
                          handleUpdateCareSection(
                            sec.id,
                            'showOnProductPage',
                            sec.showOnProductPage === false ? true : false
                          )
                        }
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          sec.showOnProductPage !== false ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            sec.showOnProductPage !== false ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-stone-600">
                        Show on Product Page
                      </span>
                    </div>

                    {/* Delete Trash Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCareSection(sec.id)}
                      title="Delete section"
                      className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                </div>

                {/* Full-Width Formatted Content Editor */}
                <div className="w-full rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                  {/* Editor Toolbar */}
                  <div className="border-b border-stone-200/80 bg-[#fbf9f6] px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
                    {/* Style selector */}
                    <div className="relative inline-flex items-center">
                      <select
                        aria-label="Text Style"
                        defaultValue="normal"
                        onChange={(e) => {
                          handleFormatText(sec.id, e.target.value);
                          e.target.value = 'normal';
                        }}
                        className="h-7 pl-2.5 pr-6 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e] cursor-pointer appearance-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="h3">Heading</option>
                        <option value="h4">Subheading</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 text-stone-400 text-[10px]">▼</span>
                    </div>

                    <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                    {/* Bold */}
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => handleFormatText(sec.id, 'bold')}
                      className="w-7 h-7 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      B
                    </button>

                    {/* Italic */}
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => handleFormatText(sec.id, 'italic')}
                      className="w-7 h-7 rounded-lg text-xs italic text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      I
                    </button>

                    {/* Underline */}
                    <button
                      type="button"
                      title="Underline"
                      onClick={() => handleFormatText(sec.id, 'underline')}
                      className="w-7 h-7 rounded-lg text-xs underline text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      U
                    </button>

                    <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                    {/* Bullet List */}
                    <button
                      type="button"
                      title="Bullet List"
                      onClick={() => handleFormatText(sec.id, 'bullet')}
                      className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="9" y1="6" x2="20" y2="6" />
                        <line x1="9" y1="12" x2="20" y2="12" />
                        <line x1="9" y1="18" x2="20" y2="18" />
                        <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                      </svg>
                    </button>

                    {/* Numbered List */}
                    <button
                      type="button"
                      title="Numbered List"
                      onClick={() => handleFormatText(sec.id, 'number')}
                      className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="10" y1="6" x2="21" y2="6" />
                        <line x1="10" y1="12" x2="21" y2="12" />
                        <line x1="10" y1="18" x2="21" y2="18" />
                        <text x="2" y="7" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">1</text>
                        <text x="2" y="13" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">2</text>
                        <text x="2" y="19" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">3</text>
                      </svg>
                    </button>

                    {/* Insert Link */}
                    <button
                      type="button"
                      title="Insert Link"
                      onClick={() => handleFormatText(sec.id, 'link')}
                      className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <HiOutlineLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Editor Textarea */}
                  <textarea
                    id={`care-desc-${sec.id}`}
                    rows={5}
                    value={sec.description}
                    onChange={(e) =>
                      handleUpdateCareSection(sec.id, 'description', e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDownDescription(e, sec.id)}
                    placeholder="To keep your jewellery looking beautiful for years:&#10;• Avoid contact with water, perfumes, and harsh chemicals.&#10;• Store in a soft pouch or jewellery box.&#10;• Clean gently with a soft, dry cloth after every use.&#10;• Keep away from direct sunlight and moisture."
                    className="w-full p-3.5 text-xs text-stone-800 leading-relaxed bg-white focus:outline-none resize-y min-h-[120px] font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sub-block B: Product Specifications */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
              <TbListDetails className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Product Specifications
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                  {specifications.length} Added
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddSpecification}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Specification</span>
          </button>
        </div>

        {specifications.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5]">
            <p className="text-xs text-stone-500 font-medium">
              No product specifications added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {specifications.map((spec, sIdx) => (
              <div key={spec.id} className="flex items-center gap-2.5">
                {/* Move Up/Down Controls for Specifications */}
                <div className="flex flex-col -space-y-0.5 bg-white border border-stone-200/90 px-1 py-0.5 rounded-lg shrink-0 shadow-2xs">
                  <button
                    type="button"
                    disabled={sIdx === 0}
                    onClick={() => handleMoveSpecification(sIdx, -1)}
                    title="Move specification up"
                    className="w-4 h-3.5 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] rounded disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={sIdx === specifications.length - 1}
                    onClick={() => handleMoveSpecification(sIdx, 1)}
                    title="Move specification down"
                    className="w-4 h-3.5 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] rounded disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleUpdateSpecification(spec.id, 'key', e.target.value)}
                  placeholder="Specification Name (e.g. Clasp Type, Dimensions)"
                  className="flex-1 h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpecification(spec.id, 'value', e.target.value)}
                  placeholder="Value (e.g. Lobster Clasp, 7.5 Inches)"
                  className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecification(spec.id)}
                  title="Remove specification"
                  className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
