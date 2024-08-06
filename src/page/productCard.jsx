import React from 'react';
import './productCard.css'; 

const ProductCard = ({ title, description, models }) => {
    const formatPrice = (price) => {
        return Math.floor(price).toLocaleString('es-AR');
    };

    return (
        <div className="product-card">
            <h2>{title}</h2>
            <p>{description}</p>
            <ul className="price-list">
                {models.map((model, index) => (
                    <li key={index}>
                        {model.size} - {formatPrice(model.price)}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductCard;
