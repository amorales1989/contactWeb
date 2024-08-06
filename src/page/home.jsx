import React, { useEffect, useState } from 'react';
import './home.css';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";
import { FaMoon, FaSun } from 'react-icons/fa';
import real from '../assets/real.jpg';
import logo from '../assets/fisher.jpg';
import dorado from '../assets/dorado.jpg';
import ensueño from '../assets/ensueño.png';
import promo6 from '../assets/promo6.png';
import { supabase } from '../api';
import ProductCard from './productCard'; 

const ContactPage = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [showOffer, setShowOffer] = useState(true);
    const [productData, setProductData] = useState([]);
    const [formattedProducts, setFormattedProducts] = useState([]);
    const [businessDescription, setBusinessDescription] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchBusinessDescription();
    }, []);

    useEffect(() => {
        formatProductData();
    }, [productData]);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*');
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
        const groupedProducts = productData?.reduce((acc, product) => {
            const { linea, modelo, precio, descripcion } = product;
    
            // Verifica que los campos necesarios no sean null o vacíos
            if (!linea || !modelo || !precio) {
                return acc; // Ignora este producto si falta información
            }
            
            // Limpia y convierte el precio a número
            const numericPrice = parseFloat(precio.replace('.', '').replace(',', '.'));
    
            if (isNaN(numericPrice)) {
                return acc; // Ignora si el precio no es un número válido
            }
    
            if (!acc[linea]) {
                acc[linea] = {
                    title: linea,
                    description: descripcion || '', // Asigna una cadena vacía si la descripción es null
                    models: []
                };
            }
    
            acc[linea].models.push({
                size: modelo,
                price: numericPrice // Usa el precio numérico
            });
    
            return acc;
        }, {});
    
        // Ordena los modelos por precio de menor a mayor
        for (const key in groupedProducts) {
            groupedProducts[key].models.sort((a, b) => a.price - b.price);
        }
    
        setFormattedProducts(Object.values(groupedProducts));
    };
    
    

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const images = [
        { original: real, thumbnail: real },
        { original: dorado, thumbnail: dorado },
        { original: ensueño, thumbnail: ensueño },
    ];

    const handleWhatsAppClick = () => {
        window.location.href = 'https://wa.me/5491133414526';
    };

    const handleCloseOffer = () => {
        setShowOffer(false);
    };

    useEffect(() => {
        setShowOffer(true);
    }, []);

    return (
        <div className={`contact-page ${darkMode ? 'dark' : ''}`}>
            {showOffer && (
                <div className="offer-alert">
                    <div className="offer-content">
                        <img src={promo6} alt="Colchón ConfortPlus" className="product-image" />
                        <button onClick={handleCloseOffer} className="close-button">Cerrar</button>
                    </div>
                </div>
            )}
            <nav className="navbar">
                <div className="nav-links">
                    <a href="/editproducts">Quiénes Somos</a>
                    <a href="#product">Modelos</a>
                    <a href="#gallery">Galería</a>
                    <a href="#contact">Contacto</a>
                    <div onClick={toggleDarkMode} className="dark-mode-toggle">
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </div>
                </div>
            </nav>

            <header id="home" className="contact-header">
                <img src={logo} alt="Logo Fisher" className="product-image" />
            </header>

            <section id="about" className="about-section">
                <h2>Quiénes Somos</h2>
                <p>{businessDescription}</p>
            </section>

            <section id="product" className="product-section">
                {formattedProducts.map((product, index) => (
                    <ProductCard
                        key={index}
                        title={product.title}
                        description={product.description}
                        models={product.models}
                    />
                ))}
            </section>

            <section id="gallery" className="gallery-section">
                <h2>Galería</h2>
                <div style={{ height: '250px' }}>
                    <ImageGallery items={images} showThumbnails={false} autoPlay={true} showPlayButton={false} showFullscreenButton={false} />
                </div>
            </section>

            <section id="contact" className="contact-section">
                <h2>Ventas</h2>
                <button className="button2" onClick={handleWhatsAppClick}>
                    WhatsApp
                    <svg viewBox="0 0 48 48" y="0px" x="0px" xmlns="http://www.w3.org/2000/svg">
                        {/* SVG path here */}
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
