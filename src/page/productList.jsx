// ProductList.js
import React from 'react';
import ProductCard from './productCard'; // Ajusta la ruta según tu estructura de carpetas

const ProductList = ({ formattedProducts }) => {
    return (
        <div className="product-list">
            {formattedProducts.map((product, index) => (
                <ProductCard
                    key={index}
                    title={product.title}
                    description={product.description}
                    models={product.models}
                />
            ))}
        </div>
    );
};

export default ProductList;
