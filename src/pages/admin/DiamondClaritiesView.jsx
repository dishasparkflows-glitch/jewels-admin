import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function DiamondClaritiesView() {
  return (
    <ConfigEntityView
      title="Diamond Clarities"
      singularTitle="Diamond Clarity"
      addLabel="Add Clarity"
      endpoint="/diamond-clarities"
      uploadFolder="diamond/clarity"
      hasIcon={true}
      hasCode={false}
      placeholderPrefix="DC"
    />
  );
}
