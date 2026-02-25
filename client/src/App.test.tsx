import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

// Basic render test to ensure testing environment is properly set up
describe('LoginPage', () => {
    it('renders login form properly', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <LoginPage />
                </AuthProvider>
            </BrowserRouter>
        );

        // Check if the Maia logo/text is present
        expect(screen.getByText('MAIA')).toBeInTheDocument();

        // Check if the inputs are present
        expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();

        // Check if the submit button is present
        expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    });
});
