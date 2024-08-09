import React, { useState } from 'react';
import { supabase } from '../api';
import './login.css';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        socialReason: '',
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSignup) {
            // Check for existing email
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', formData.email);

            if (error) {
                console.error('Error checking email:', error);
                return;
            }

            if (data.length > 0) {
                alert('Email already exists');
                return;
            }

            // Insert new user
            const { data: insertData, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        usuario: formData.username,
                        password: formData.password,
                        email: formData.email,
                        socialReason: formData.socialReason,
                    },
                ]);

            if (insertError) {
                console.error('Error inserting user:', insertError);
            } else {
                alert('Registration successful');
                setFormData({
                    username: '',
                    password: '',
                    email: '',
                    socialReason: '',
                });
            }
        } else {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('usuario', formData.username)
                .eq('password', formData.password);

            if (error) {
                console.error('Error logging in:', error);
            } else if (data.length > 0) {
                // Login successful
                const socialReason = data[0].id;
                alert('Login successful');
                navigate(`/editproducts?id=${encodeURIComponent(socialReason)}`);
                setFormData({
                    username: '',
                    password: '',
                    email: '',
                    socialReason: '',
                });
            } else {
                // Invalid credentials
                alert('Invalid username or password');
            }
        }
    };

    return (
        <div className="container">
            <input
                id="signup_toggle"
                type="checkbox"
                checked={isSignup}
                onChange={() => setIsSignup(!isSignup)}
            />
            <form className="form" onSubmit={handleSubmit}>
                <div className="form_front">
                    <div className="form_details">Iniciar sesión</div>
                    <input
                        type="text"
                        name="username"
                        className="input"
                        placeholder="Usuario"
                        value={formData.username}
                        onChange={handleChange}
                    />
                    <input
                        type="password"
                        name="password"
                        className="input"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <button className="btn">Entrar</button>
                    <span className="switch">
                        No estás registrado?
                        <label htmlFor="signup_toggle" className="signup_tog2">
                            Registrarse
                        </label>
                    </span>
                </div>
                <div className="form_back">
                    <div className="form_details">Registro</div>
                    <input
                        type="text"
                        name="socialReason"
                        className="input"
                        placeholder="Razón social"
                        value={formData.socialReason}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="username"
                        className="input"
                        placeholder="Usuario"
                        value={formData.username}
                        onChange={handleChange}
                    />
                    <input
                        type="password"
                        name="password"
                        className="input"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <input
                        type="email"
                        name="email"
                        className="input"
                        placeholder="E-mail"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <button className="btn">Registrarse</button>
                    <span className="switch">
                        Estás registrado?
                        <label htmlFor="signup_toggle" className="signup_tog">
                            Iniciar sesión
                        </label>
                    </span>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
