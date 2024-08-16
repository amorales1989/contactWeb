import React, { useEffect, useState } from 'react';
import './home.css';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";
import { FaMoon, FaSun } from 'react-icons/fa';
import { supabase } from '../api';
import ProductCard from '../page/productCard';
import { useLocation } from 'react-router-dom';
import SmoothScroll from 'smooth-scroll';

const ContactPage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [productData, setProductData] = useState([]);
    const [formattedProducts, setFormattedProducts] = useState([]);
    const [businessDescription, setBusinessDescription] = useState('');
    const location = useLocation();
    const company = location.pathname.slice(1);
    const scroll = new SmoothScroll('a[href*="#"]');

    useEffect(() => {
        fetchCurrentUser();
        fetchProducts();
        fetchBusinessDescription();
    }, []);

    useEffect(() => {
        if (productData.length) {
            formatProductData();
        }
    }, [productData]);

    const fetchCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (company) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('socialReason', company)
                    .single();

                if (error) throw error;
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Error fetching user information:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .is('deleted_at', null);
            if (error) throw error;
            setProductData(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchBusinessDescription = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('descripcion')
                .eq('id', '4fa1d63d-9151-4549-b734-0e0079edf45f')
                .single();
            if (error) throw error;
            setBusinessDescription(data?.descripcion || '');
        } catch (error) {
            console.error('Error fetching business description:', error);
        }
    };

    const formatProductData = () => {
        const groupedProducts = productData.reduce((acc, { linea, modelo, precio, descripcion, image }) => {
            if (!linea || !modelo || !precio) return acc;

            const numericPrice = parseFloat(precio.replace('.', '').replace(',', '.'));
            if (isNaN(numericPrice)) return acc;

            if (!acc[linea]) {
                acc[linea] = {
                    title: linea,
                    description: descripcion || '',
                    imageUrl: image || '',
                    models: []
                };
            } else if (descripcion) {
                acc[linea].description = descripcion;
            }
            if (image) {
                acc[linea].imageUrl = image;
            }

            acc[linea].models.push({ size: modelo, price: numericPrice });
            return acc;
        }, {});

        Object.values(groupedProducts).forEach(group =>
            group.models.sort((a, b) => a.price - b.price)
        );

        setFormattedProducts(Object.values(groupedProducts));
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleWhatsAppClick = () => {
        const phoneNumber = `549${currentUser?.phone}`;
        const message = 'Hola, me interesa un producto que vi en tu página.';
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.location.href = url;
    };

    const productsWithGallery = productData.filter(({ view_gallery }) => view_gallery);
    const images = productsWithGallery.map(({ image }) => ({
        original: image,
        thumbnail: image
    }));

    return (
        <div className={`contact-page ${darkMode ? 'dark' : ''}`}>
            <nav className="navbar">
                <div className="nav-links">
                    {currentUser?.infoNegocio && <a href="#about">Quiénes Somos</a>}
                    <a href="#product">Modelos</a>
                    {currentUser?.galeria && <a href="#gallery">Galería</a>}
                    <a href="#contact">Contacto</a>
                    <div onClick={toggleDarkMode} className="dark-mode-toggle">
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </div>
                </div>
            </nav>

            <header id="home" className="contact-header">
                {currentUser?.logo ? (
                    <img src={currentUser.logo} alt="Logo" className="product-image" />
                ) : (
                    <h2>Bienvenido a {currentUser?.socialReason}</h2>
                )}
            </header>

            {currentUser?.infoNegocio && (
                <section id="about" className="about-section">
                    <h2>Quiénes Somos</h2>
                    <p>{businessDescription}</p>
                </section>
            )}

            <section id="product" className="product-section">
                {formattedProducts.map((product, index) => (
                    <ProductCard
                        key={index}
                        title={product.title}
                        description={product.description}
                        models={product.models}
                        imageUrl={product.imageUrl}
                        isDarkMode={darkMode}
                    />
                ))}
            </section>

            {currentUser?.galeria && (
                <section id="gallery" className="gallery-section">
                    <h2>Galería</h2>
                    <div className="gallery-container">
                        <ImageGallery
                            items={images}
                            showThumbnails={false}
                            autoPlay={true}
                            showPlayButton={false}
                            showFullscreenButton={false}
                        />
                    </div>
                </section>
            )}

            <section id="contact" className="contact-section">
                <h2>Contacto</h2>
                <button className="button2" onClick={handleWhatsAppClick}>
                    WhatsApp
                    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        {/* SVG Paths */}
                    </svg>
                </button>
            </section>

            <footer className="contact-footer">
                <p>&copy; 2024 Diseños Web <a href="mailto:a19morales89@gmail.com">a19morales89@gmail.com</a> Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default ContactPage;
