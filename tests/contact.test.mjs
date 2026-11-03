import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareInquiry, SERVICES } from '../public/contact.js';
const inquiry = { name: '  Ana García  ', service: SERVICES[0], message: 'Quiero una página para mi negocio.', consent: true };
test('Prepara un enlace al contacto verificado con texto correcto y acentos', () => {
  const url = prepareInquiry(inquiry);
  assert.equal(url.origin, 'https://wa.me'); assert.equal(url.pathname, '/529991850841');
  assert.match(url.searchParams.get('text'), /Soy Ana García/); assert.match(url.searchParams.get('text'), /página para mi negocio/);
});
test('Los símbolos no permiten inyectar parámetros ni cambiar el destinatario', () => {
  const url = prepareInquiry({ ...inquiry, message: '<script>alert(1)</script> &phone=123 # fragmento' });
  assert.equal([...url.searchParams].length, 1); assert.equal(url.hash, ''); assert.equal(url.pathname, '/529991850841');
  assert.ok(url.searchParams.get('text').includes('<script>'));
});
test('Rechaza envío sin consentimiento, spam y servicios arbitrarios', () => {
  for (const override of [{ consent: false }, { consent: 'true' }, { website: 'spam' }, { service: 'inventado' }, { name: null }, { name: ' ' }, { message: 'corta' }, { message: 'a'.repeat(1501) }, { name: 'a'.repeat(81) }]) assert.throws(() => prepareInquiry({ ...inquiry, ...override }));
});
test('Elimina caracteres de control y dirección de texto', () => {
  const url = prepareInquiry({ ...inquiry, name: 'Ana\u202e\u0001 García' });
  assert.match(url.searchParams.get('text'), /Soy Ana García/);
});
