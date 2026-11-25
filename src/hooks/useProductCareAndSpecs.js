import { useState, useCallback } from 'react';

/**
 * Internal helper for HTML5 drag-and-drop + up/down reordering on a state array.
 */
function useReorderableList(setItems) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const moveItem = useCallback((index, direction) => {
    setItems((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  }, [setItems]);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // Ignore drag dataTransfer errors in unsupported browsers
    }
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex((prev) => (prev !== index ? index : prev));
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setItems((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, setItems]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return {
    draggedIndex,
    dragOverIndex,
    moveItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

/**
 * Shared state and handlers for Product Care Sections and Specifications
 * used across AddJewelryProduct and OrnateProductEdit.
 */
export default function useProductCareAndSpecs() {
  const [careSections, setCareSections] = useState([]);
  const [specifications, setSpecifications] = useState([]);

  const careDrag = useReorderableList(setCareSections);
  const specDrag = useReorderableList(setSpecifications);

  const handleAddCareSection = useCallback(() => {
    setCareSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        header: 'Care Instructions',
        description: '',
        showOnProductPage: true,
      },
    ]);
  }, []);

  const handleUpdateCareSection = useCallback((secId, field, val) => {
    setCareSections((prev) =>
      prev.map((sec) => (sec.id === secId ? { ...sec, [field]: val } : sec))
    );
  }, []);

  const handleRemoveCareSection = useCallback((secId) => {
    setCareSections((prev) => prev.filter((sec) => sec.id !== secId));
  }, []);

  const handleFormatText = useCallback((sectionId, type) => {
    const textarea = document.getElementById(`care-desc-${sectionId}`);
    setCareSections((prev) => {
      const section = prev.find((s) => s.id === sectionId);
      if (!section) return prev;

      const text = section.description || '';
      const start = textarea?.selectionStart ?? text.length;
      const end = textarea?.selectionEnd ?? text.length;
      const selected = text.substring(start, end);

      let replacement = '';
      let newCursorPos = start;

      switch (type) {
        case 'bold':
          replacement = selected ? `**${selected}**` : '**bold text**';
          newCursorPos = selected ? end + 4 : start + 2;
          break;
        case 'italic':
          replacement = selected ? `*${selected}*` : '*italic text*';
          newCursorPos = selected ? end + 2 : start + 1;
          break;
        case 'underline':
          replacement = selected ? `<u>${selected}</u>` : '<u>underlined text</u>';
          newCursorPos = selected ? end + 7 : start + 3;
          break;
        case 'h3':
          replacement = `\n### ${selected || 'Heading'}\n`;
          newCursorPos = start + replacement.length;
          break;
        case 'h4':
          replacement = `\n#### ${selected || 'Subheading'}\n`;
          newCursorPos = start + replacement.length;
          break;
        case 'bullet': {
          const prefix = start === 0 || text[start - 1] === '\n' ? '• ' : '\n• ';
          replacement = prefix + (selected || '');
          newCursorPos = start + prefix.length + (selected ? selected.length : 0);
          break;
        }
        case 'number': {
          const prefix = start === 0 || text[start - 1] === '\n' ? '1. ' : '\n1. ';
          replacement = prefix + (selected || '');
          newCursorPos = start + prefix.length + (selected ? selected.length : 0);
          break;
        }
        case 'link': {
          const url = prompt('Enter link URL (e.g. https://...):', 'https://');
          if (!url) return prev;
          replacement = selected ? `[${selected}](${url})` : `[Link](${url})`;
          newCursorPos = start + replacement.length;
          break;
        }
        default:
          break;
      }

      const newText = text.substring(0, start) + replacement + text.substring(end);
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);

      return prev.map((sec) => (sec.id === sectionId ? { ...sec, description: newText } : sec));
    });
  }, []);

  const handleKeyDownDescription = useCallback((e, sectionId) => {
    if (e.key !== 'Enter') return;
    const textarea = e.target;
    const val = textarea.value;
    const pos = textarea.selectionStart;
    const lastLineStart = val.lastIndexOf('\n', pos - 1) + 1;
    const currentLine = val.substring(lastLineStart, pos);

    if (currentLine.startsWith('• ')) {
      e.preventDefault();
      if (currentLine.trim() === '•') {
        const nextVal = val.substring(0, lastLineStart) + val.substring(pos);
        handleUpdateCareSection(sectionId, 'description', nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(lastLineStart, lastLineStart);
        }, 0);
      } else {
        const nextVal = val.substring(0, pos) + '\n• ' + val.substring(pos);
        handleUpdateCareSection(sectionId, 'description', nextVal);
        setTimeout(() => {
          textarea.setSelectionRange(pos + 3, pos + 3);
        }, 0);
      }
    }
  }, [handleUpdateCareSection]);

  const handleAddSpecification = useCallback(() => {
    setSpecifications((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}`,
        key: '',
        value: '',
      },
    ]);
  }, []);

  const handleUpdateSpecification = useCallback((specId, field, val) => {
    setSpecifications((prev) =>
      prev.map((spec) => (spec.id === specId ? { ...spec, [field]: val } : spec))
    );
  }, []);

  const handleRemoveSpecification = useCallback((specId) => {
    setSpecifications((prev) => prev.filter((spec) => spec.id !== specId));
  }, []);

  return {
    careSections,
    setCareSections,
    handleAddCareSection,
    handleUpdateCareSection,
    handleRemoveCareSection,
    handleMoveCareSection: careDrag.moveItem,
    draggedCareIndex: careDrag.draggedIndex,
    dragOverCareIndex: careDrag.dragOverIndex,
    handleCareDragStart: careDrag.handleDragStart,
    handleCareDragOver: careDrag.handleDragOver,
    handleCareDrop: careDrag.handleDrop,
    handleCareDragEnd: careDrag.handleDragEnd,
    handleFormatText,
    handleKeyDownDescription,
    specifications,
    setSpecifications,
    handleAddSpecification,
    handleUpdateSpecification,
    handleRemoveSpecification,
    handleMoveSpecification: specDrag.moveItem,
    draggedSpecIndex: specDrag.draggedIndex,
    dragOverSpecIndex: specDrag.dragOverIndex,
    handleSpecDragStart: specDrag.handleDragStart,
    handleSpecDragOver: specDrag.handleDragOver,
    handleSpecDrop: specDrag.handleDrop,
    handleSpecDragEnd: specDrag.handleDragEnd,
  };
}
