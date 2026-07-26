import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { refreshTransactionStatus, resetCheckout } from './checkoutSlice';

const STATUS_COPY = {
  APPROVED: {
    title: '¡Pago aprobado!',
    description: 'Tu pedido fue confirmado y pronto será enviado.',
  },
  DECLINED: {
    title: 'Pago rechazado',
    description: 'La transacción fue declinada. Intenta con otra tarjeta.',
  },
  ERROR: {
    title: 'Ocurrió un error',
    description: 'No pudimos procesar tu pago. Intenta nuevamente más tarde.',
  },
  PENDING: {
    title: 'Procesando tu pago…',
    description: 'Estamos confirmando el estado de tu transacción.',
  },
} as const;

export function StatusPage() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.checkout.step);
  const transactionId = useAppSelector((state) => state.checkout.transactionId);
  const transactionStatus = useAppSelector((state) => state.checkout.transactionStatus);

  useEffect(() => {
    if (step === 'STATUS' && transactionId && transactionStatus === 'PENDING') {
      dispatch(refreshTransactionStatus(transactionId));
    }
  }, [dispatch, step, transactionId, transactionStatus]);

  if (step !== 'STATUS') {
    return null;
  }

  const copy = STATUS_COPY[transactionStatus ?? 'ERROR'];

  return (
    <main className="status-page">
      <article className={`status-card status-card--${(transactionStatus ?? 'ERROR').toLowerCase()}`}>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <Button onClick={() => dispatch(resetCheckout())}>Volver a la tienda</Button>
      </article>
    </main>
  );
}
