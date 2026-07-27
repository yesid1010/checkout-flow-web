import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { PRODUCT_ID } from '../../config/env';
import { openCheckoutModal } from '../checkout/checkoutSlice';
import { fetchProduct } from './productSlice';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductPage() {
  const dispatch = useAppDispatch();
  const { data: product, status, error } = useAppSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchProduct(PRODUCT_ID));
  }, [dispatch]);

  if (status === 'idle' || status === 'loading') {
    return (
      <main className="product-page">
        <p role="status">Cargando producto…</p>
      </main>
    );
  }

  if (status === 'failed' || !product) {
    return (
      <main className="product-page">
        <p role="alert">{error}</p>
      </main>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <main className="product-page">
      <article className="product-card">
        <img
          className="product-image"
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={600}
          loading="lazy"
        />
        <h1>{product.name}</h1>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{formatCurrency(product.priceInCents)}</p>
        <p className="product-stock">
          {outOfStock ? 'Sin stock disponible' : `${product.stock} unidades disponibles`}
        </p>
        <Button disabled={outOfStock} onClick={() => dispatch(openCheckoutModal())}>
          Pagar con tarjeta
        </Button>
      </article>
    </main>
  );
}
