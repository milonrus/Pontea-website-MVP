import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWebhookPayload, validateAndNormalizeLeadPayload } from './shared';

test('validateAndNormalizeLeadPayload accepts eur_prepayment_application with universal plan', () => {
  const { payload, error } = validateAndNormalizeLeadPayload({
    leadType: 'eur_prepayment_application',
    planId: 'universal',
    currency: 'EUR',
    firstName: 'Ivan',
    lastName: 'Ivanov',
    email: 'ivan@example.com',
    phone: '+79991234567',
    payerType: 'individual',
    contractCountry: 'Italy',
    contractCity: 'Milan',
    contractPostalCode: '20121',
    contractAddress: 'Via Roma 1',
    consentOffer: true,
    consentPersonalData: true,
    consentMarketing: false,
    pagePath: '/invoice-request/',
  });

  assert.equal(error, null);
  assert.ok(payload);
  assert.equal(payload?.leadType, 'eur_prepayment_application');
  assert.equal(payload?.planId, 'universal');
  assert.equal(payload?.currency, 'EUR');
});

test('validateAndNormalizeLeadPayload rejects eur_prepayment_application with non-universal plan', () => {
  const { payload, error } = validateAndNormalizeLeadPayload({
    leadType: 'eur_prepayment_application',
    planId: 'advanced',
    currency: 'EUR',
    firstName: 'Ivan',
    lastName: 'Ivanov',
    email: 'ivan@example.com',
    phone: '+79991234567',
    payerType: 'individual',
    contractCountry: 'Italy',
    contractCity: 'Milan',
    contractPostalCode: '20121',
    contractAddress: 'Via Roma 1',
    consentOffer: true,
    consentPersonalData: true,
    consentMarketing: false,
    pagePath: '/invoice-request/?mode=prepayment',
  });

  assert.equal(payload, null);
  assert.equal(error, 'eur_prepayment_application requires universal plan');
});

test('validateAndNormalizeLeadPayload accepts eur_application with mentorship plan', () => {
  const { payload, error } = validateAndNormalizeLeadPayload({
    leadType: 'eur_application',
    planId: 'mentorship',
    currency: 'EUR',
    firstName: 'Anna',
    lastName: 'Ivanova',
    email: 'anna@example.com',
    phone: '+79991234567',
    payerType: 'individual',
    contractCountry: 'Italy',
    contractCity: 'Milan',
    contractPostalCode: '20121',
    contractAddress: 'Via Roma 1',
    consentOffer: true,
    consentPersonalData: true,
    consentMarketing: false,
    pagePath: '/invoice-request/?plan=mentorship',
  });

  assert.equal(error, null);
  assert.ok(payload);
  assert.equal(payload?.leadType, 'eur_application');
  assert.equal(payload?.planId, 'mentorship');
  assert.equal(payload?.currency, 'EUR');
});

test('buildWebhookPayload marks eur_prepayment_application correctly', () => {
  const payload = buildWebhookPayload({
    id: 'lead-1',
    lead_type: 'eur_prepayment_application',
    webhook_status: 'captured',
    plan_id: 'universal',
    currency: 'EUR',
    first_name: 'Ivan',
    last_name: 'Ivanov',
    email: 'ivan@example.com',
    phone: '+79991234567',
    payer_type: 'individual',
    comment: null,
    contract_country: 'Italy',
    contract_city: 'Milan',
    contract_postal_code: '20121',
    contract_address: 'Via Roma 1',
    page_path: '/invoice-request/?mode=prepayment',
    invoice_order_number: 100777,
    created_at: '2026-02-21T10:00:00.000Z',
  });

  assert.equal(payload.paymentKind, 'prepayment');
  assert.equal(payload.prepaymentAmountEur, 100);
  assert.equal(payload.prepaymentAmountRub, 9000);
  assert.equal(payload.orderNumber, 100777);
});
