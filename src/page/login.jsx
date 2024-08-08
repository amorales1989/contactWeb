import React, { useState } from 'react';
import { supabase } from '../api';
import './login.css'; // Asegúrate de tener este archivo CSS
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

    console.log(formData)
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
            }
        } else {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('usuario', formData.username)
                .eq('password', formData.password);
            console.log(data)
            if (error) {
                console.error('Error logging in:', error);
            } else if (data.length > 0) {
                // Login successful
                const socialReason = data[0].id;
                navigate(`/editproducts?id=${encodeURIComponent(socialReason)}`);
            } else {
                // Invalid credentials
                alert('Invalid username or password');
            }
        }
    };

    return (
        <div class="container">
            <input id="signup_toggle" type="checkbox" checked={isSignup} onChange={() => setIsSignup(!isSignup)} />
            <form class="form" onSubmit={handleSubmit}>
                <div class="form_front">

                    <div class="form_details">Iniciar sesión</div>
                    <input type="text" class="input" placeholder="Usuario" />
                    <input type="text" class="input" placeholder="Contraseña" />
                    <button class="btn">Entrar</button>
                    <span class="switch">No estas registrado?
                        <label for="signup_toggle" class="signup_tog2">
                            Regitrarse
                        </label>
                    </span>
                </div>
                <div class="form_back" >
                    <div class="form_details">Registro</div>
                    <input type="text" name="socialReason" className="input" placeholder="Razón social" onChange={handleChange} />
                    <input type="text" name="username" className="input" placeholder="Usuario" onChange={handleChange} />
                    <input type="password" name="password" className="input" placeholder="Contraseña" onChange={handleChange} />
                    <input type="email" name="email" className="input" placeholder="E-mail" onChange={handleChange} />
                    <button class="btn">Registrase</button>
                    <span class="switch">Estas registrado?
                        <label for="signup_toggle" class="signup_tog">
                            iniciar sesión
                        </label>
                    </span>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
