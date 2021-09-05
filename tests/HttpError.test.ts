import HttpError from '../src/HttpError';

test('Test HttpError constructor', async (): Promise<void> => {
  const err = new HttpError(200, 'Error-Code 200');

  expect(err).toBeInstanceOf(Error);

  expect(err.httpStatus).toBe(200);
  expect(err.message).toBe('Error-Code 200');

  expect(err.isInternalMessage).toBeFalsy();
});

test('Test HttpError constructor', async (): Promise<void> => {
  const err = new HttpError(200, 'Error-Code 200', true);

  expect(err.isInternalMessage).toBeTruthy();
});
