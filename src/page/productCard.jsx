import React from 'react';
import './productCard.css'; 

const ProductCard = ({ title, description, models, imageUrl }) => {
    const formatPrice = (price) => {
        return Math.floor(price).toLocaleString('es-AR');
    };

    return (
        <div className="product-card">
            <h2>{title}</h2>
            <p>{description}</p>
            {imageUrl && <img src={imageUrl} alt={title} className="product" />}
            <ul className="price-list">
                {models.map((model, index) => (
                    <li key={index}>
                        {model.size}.....${formatPrice(model.price)}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductCard;
