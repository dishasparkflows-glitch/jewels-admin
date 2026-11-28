import { useAddJewelryProductContext } from './AddJewelryProductContext';
import SeoConfigTab from '../../../components/ornate/tabs/SeoConfigTab';

export default function Step6SeoPublish() {
  const { getStepPosition, seo, setSeo, basicDetails, setBasicDetails } = useAddJewelryProductContext();

  return (
    <SeoConfigTab
      stepNumber={getStepPosition(6)}
      seo={seo}
      setSeo={setSeo}
      soldCount={basicDetails.soldCount}
      reviewCount={basicDetails.reviewCount}
      onSoldCountChange={(val) => setBasicDetails((prev) => ({ ...prev, soldCount: val }))}
      onReviewCountChange={(val) => setBasicDetails((prev) => ({ ...prev, reviewCount: val }))}
    />
  );
}
