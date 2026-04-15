import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { doc, setDoc } from 'firebase/firestore';

// Mocking firebase
jest.mock('./firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve([])),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

describe('App component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders login screen initially', () => {
    render(<App />);
    expect(screen.getByText('Доступ закрыт')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument();
  });

  test('shows error with wrong password', () => {
    render(<App />);
    const passwordInput = screen.getByPlaceholderText('••••••');
    const loginButton = screen.getByText('Войти');

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    expect(screen.getByText('Извините, неверный пароль 😔')).toBeInTheDocument();
  });

  test('unlocks with correct password', () => {
    render(<App />);
    const passwordInput = screen.getByPlaceholderText('••••••');
    const loginButton = screen.getByText('Войти');

    fireEvent.change(passwordInput, { target: { value: '885522' } });
    fireEvent.click(loginButton);

    expect(screen.queryByText('Доступ закрыт')).not.toBeInTheDocument();
  });

  describe('when logged in', () => {
    beforeEach(() => {
      render(<App />);
      // Unlock first
      fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '885522' } });
      fireEvent.click(screen.getByText('Войти'));
    });

    test('modal opens and closes', () => {
      // Open modal
      const openModalButton = screen.getByText('Внести данные');
      fireEvent.click(openModalButton);
      expect(screen.getByText('Внести данные')).toBeInTheDocument();

      // Close modal
      const closeModalButton = screen.getByLabelText('close-modal');
      fireEvent.click(closeModalButton);
      expect(screen.queryByText('Внести данные')).not.toBeInTheDocument();
    });

    test('shows error when saving with no data', async () => {
      // Open modal
      const openModalButton = screen.getByText('Внести данные');
      fireEvent.click(openModalButton);

      const saveButton = screen.getByText('Сохранить данные');
      fireEvent.click(saveButton);

      expect(await screen.findByText('Введите хотя бы одно значение!')).toBeInTheDocument();
    });

    test('saves data correctly', async () => {
      // Open modal
      const openModalButton = screen.getByText('Внести данные');
      fireEvent.click(openModalButton);

      // Fill form
      fireEvent.change(screen.getByLabelText('Ольха:'), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText('Береза:'), { target: { value: '20' } });

      // Save data
      const saveButton = screen.getByText('Сохранить данные');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledTimes(1);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(doc).toHaveBeenCalledWith({}, 'measurements', today);

      expect(setDoc).toHaveBeenCalledWith(undefined, {
        date: today,
        alder: 10,
        hazel: 0,
        birch: 20,
        oak: 0,
      });

      // Modal should be closed after saving
      expect(screen.queryByText('Внести данные')).not.toBeInTheDocument();
    });
  });
});
