import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { detectCardBrand } from '../../lib/cardBrand';
import { isValidLuhn } from '../../lib/luhn';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import type { DocumentType } from '../../services/api';
import { tokenizeCard, WompiError } from '../../services/wompi';
import { closeCheckoutModal, submitCheckoutForm } from './checkoutSlice';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
];

export function CardModal() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.checkout.step);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [installments, setInstallments] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(step === 'CHECKOUT_MODAL');

  if (step !== 'CHECKOUT_MODAL') {
    return null;
  }

  const brand = detectCardBrand(cardNumber);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isValidLuhn(cardNumber)) {
      setFormError('El número de tarjeta no es válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cardToken = await tokenizeCard({
        number: cardNumber.replace(/\s+/g, ''),
        cvc,
        expMonth,
        expYear,
        cardHolder,
      });

      dispatch(
        submitCheckoutForm({
          customer: { fullName, email, documentType, documentNumber, phoneNumber },
          delivery: {
            recipientName: fullName,
            recipientPhone: phoneNumber,
            address,
            city,
            addressDetails: addressDetails || undefined,
          },
          cardToken,
          installments,
        }),
      );
    } catch (error) {
      setFormError(
        error instanceof WompiError ? error.message : 'No se pudo procesar la tarjeta.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Datos de pago">
      <div className="modal">
        <form onSubmit={handleSubmit}>
          <h2>Datos personales</h2>
          <label>
            Nombre completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Tipo de documento
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            >
              {DOCUMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Número de documento
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
            />
          </label>
          <label>
            Teléfono
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </label>

          <h2>Datos de la tarjeta</h2>
          <label>
            Número de tarjeta
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          {brand !== 'unknown' && <span className="card-brand">{brand}</span>}
          <label>
            Nombre en la tarjeta
            <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} required />
          </label>
          <label>
            Mes de expiración
            <input
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              placeholder="MM"
              required
            />
          </label>
          <label>
            Año de expiración
            <input
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              placeholder="AA"
              required
            />
          </label>
          <label>
            CVC
            <input value={cvc} onChange={(e) => setCvc(e.target.value)} required />
          </label>
          <label>
            Cuotas
            <input
              type="number"
              min={1}
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            />
          </label>

          <h2>Datos de entrega</h2>
          <label>
            Dirección
            <input value={address} onChange={(e) => setAddress(e.target.value)} required />
          </label>
          <label>
            Ciudad
            <input value={city} onChange={(e) => setCity(e.target.value)} required />
          </label>
          <label>
            Detalles adicionales (opcional)
            <input value={addressDetails} onChange={(e) => setAddressDetails(e.target.value)} />
          </label>

          {formError && <p role="alert">{formError}</p>}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dispatch(closeCheckoutModal())}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando…' : 'Continuar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
