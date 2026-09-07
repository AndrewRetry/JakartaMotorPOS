import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const {signIn} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        // stop default reload of browser
        setIsSubmitting(true);
        setError(null);

        try {
            await signIn(email, password);
        } catch (signInError) {
            setError(signInError.message);
            setIsSubmitting(false)
            // only on failure -- on success the screen unmounts
        }
    };

    // ... form markup: type="email", type="password", disabled={isSubmitting}
}