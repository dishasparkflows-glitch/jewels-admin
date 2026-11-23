import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function DiamondTypesView() {
  return (
    <ConfigEntityView
      title="Diamond Types"
      singularTitle="Diamond Type"
      addLabel="Add Type"
      endpoint="/diamond-types"
      uploadFolder="diamond/types"
      hasIcon={true}
      hasCode={false}
      placeholderPrefix="DT"
    />
  );
}
