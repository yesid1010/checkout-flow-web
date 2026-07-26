import { useAppSelector } from './app/hooks';
import { CardModal } from './features/checkout/CardModal';
import { StatusPage } from './features/checkout/StatusPage';
import { SummaryBackdrop } from './features/checkout/SummaryBackdrop';
import { ProductPage } from './features/product/ProductPage';

function App() {
  const step = useAppSelector((state) => state.checkout.step);

  if (step === 'STATUS') {
    return <StatusPage />;
  }

  return (
    <>
      <ProductPage />
      <CardModal />
      <SummaryBackdrop />
    </>
  );
}

export default App;
