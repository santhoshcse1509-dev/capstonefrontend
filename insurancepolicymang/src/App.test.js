import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  // App uses BrowserRouter, AuthContext, etc. - just verify it mounts
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
