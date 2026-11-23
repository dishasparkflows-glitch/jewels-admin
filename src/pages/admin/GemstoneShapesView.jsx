import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function GemstoneShapesView() {
  return (
    <ConfigEntityView
      title="Gemstone Shapes"
      singularTitle="Gemstone Shape"
      addLabel="Add Shape"
      endpoint="/gemstone-shapes"
      uploadFolder="gemstone-shapes"
      hasIcon={true}
      hasCode={true}
      codeLabel="Shape Code"
      placeholderPrefix="GS"
    />
  );
}
