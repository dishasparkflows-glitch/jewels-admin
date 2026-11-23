import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function DiamondColorsView() {
  return (
    <ConfigEntityView
      title="Diamond Colors"
      singularTitle="Diamond Color"
      addLabel="Add Color"
      endpoint="/diamond-colors"
      uploadFolder="diamond/color"
      hasIcon={true}
      hasCode={true}
      codeLabel="Color Grade Code"
      placeholderPrefix="DC"
    />
  );
}
