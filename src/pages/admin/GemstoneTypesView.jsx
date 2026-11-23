import ConfigEntityView from '../../components/common/ConfigEntityView';

export default function GemstoneTypesView() {
  return (
    <ConfigEntityView
      title="Gemstone Types"
      singularTitle="Gemstone Type"
      addLabel="Add Type"
      endpoint="/gemstone-types"
      uploadFolder="gemstone-types"
      hasIcon={true}
      hasCode={true}
      codeLabel="Type Code"
      placeholderPrefix="GT"
    />
  );
}
