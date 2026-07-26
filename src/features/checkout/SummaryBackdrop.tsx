import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { BASE_FEE_IN_CENTS, DELIVERY_FEE_IN_CENTS } from '../../lib/fees';
import { resetCheckout, submitTransaction } from './checkoutSlice';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.checkout.step);
  const submitStatus = useAppSelector((state) => state.checkout.submitStatus);
  const submitError = useAppSelector((state) => state.checkout.submitError);
  const productAmountInCents = useAppSelector((state) => state.product.data?.priceInCents ?? 0);

  if (step !== 'SUMMARY') {
    return null;
  }

  const totalInCents = productAmountInCents + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS;
  const isSubmitting = submitStatus === 'submitting';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Resumen de pago">
      <div className="modal">
        <h2>Resumen de tu compra</h2>
        <dl className="summary-list">
          <div className="summary-row">
            <dt>Producto</dt>
            <dd>{formatCurrency(productAmountInCents)}</dd>
          </div>
          <div className="summary-row">
            <dt>Tarifa base</dt>
            <dd>{formatCurrency(BASE_FEE_IN_CENTS)}</dd>
          </div>
          <div className="summary-row">
            <dt>Tarifa de entrega</dt>
            <dd>{formatCurrency(DELIVERY_FEE_IN_CENTS)}</dd>
          </div>
          <div className="summary-row summary-total">
            <dt>Total</dt>
            <dd>{formatCurrency(totalInCents)}</dd>
          </div>
        </dl>

        {submitStatus === 'failed' && submitError && <p role="alert">{submitError}</p>}

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch(resetCheckout())}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => dispatch(submitTransaction())} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando…' : 'Pagar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
