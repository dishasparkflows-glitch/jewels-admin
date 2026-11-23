import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function DiamondShapesView() {
  return (
    <ConfigEntityView
      title="Diamond Shapes"
      singularTitle="Diamond Shape"
      addLabel="Add Shape"
      endpoint="/diamond-shapes"
      uploadFolder="diamond/shapes"
      hasIcon={true}
      hasCode={true}
      codeLabel="Shape Code"
      placeholderPrefix="DS"
    />
  );
}
