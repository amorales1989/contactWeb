import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress, Container, TextareaAutosize } from '@mui/material';
import { supabase } from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './editPrice.css'; // Asegúrate de importar el archivo CSS

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newProduct, setNewProduct] = useState({
        linea: '',
        modelo: '',
        precio: '',
        descripcion: '',
    });
    const [editProduct, setEditProduct] = useState(null);
    const [businessDescription, setBusinessDescription] = useState('');
    const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchBusinessDescription(); // Añadido para obtener la descripción del negocio
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;

            // Agrupar productos por la propiedad 'linea'
            const groupedProducts = data.reduce((groups, product) => {
                const { linea } = product;
                if (!groups[linea]) {
                    groups[linea] = [];
                }
                groups[linea].push(product);
                return groups;
            }, {});

            // Convertir el objeto de grupos a un array de grupos para renderizar
            const groupedArray = Object.keys(groupedProducts).map(linea => ({
                linea,
                products: groupedProducts[linea],
            }));

            setProducts(groupedArray);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBusinessDescription = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('descripcion')
                .eq('id', '4fa1d63d-9151-4549-b734-0e0079edf45f') // Usa el ID específico para la descripción del negocio
                .single();
            if (error) throw error;
            setBusinessDescription(data?.descripcion || '');
        } catch (error) {
            console.error('Error fetching business description:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editProduct) {
            setEditProduct((prev) => ({
                ...prev,
                [name]: value,
            }));
        } else {
            setNewProduct((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.linea || !newProduct.modelo || !newProduct.precio) {
            console.error('All fields are required');
            return;
        }
        try {
            const { error } = await supabase.from('products').insert([newProduct]);
            if (error) throw error;
            fetchProducts();
            setNewProduct({
                linea: '',
                modelo: '',
                precio: '',
                descripcion: '',
            });
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        if (!editProduct.linea || !editProduct.modelo || !editProduct.precio) {
            console.error('All fields are required');
            return;
        }
        try {
            const { error } = await supabase
                .from('products')
                .update(editProduct)
                .eq('id', editProduct.id);
            if (error) throw error;
            fetchProducts();
            setEditProduct(null);
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const handleEditClick = (product) => {
        setEditProduct(product);
    };

    const handleDeleteProduct = async (id) => {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleDescriptionSave = async () => {
        if (!businessDescription) {
            console.error('La descripción no puede estar vacía');
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .upsert([{ id: '4fa1d63d-9151-4549-b734-0e0079edf45f', descripcion: businessDescription }]);

            if (error) throw error;
            console.log('Descripción del negocio guardada');
            setShowDescriptionEditor(false);
            fetchProducts(); // Opcional, para refrescar la lista de productos
        } catch (error) {
            console.error('Error saving business description:', error);
        }
    };

    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Reordenar productos dentro del grupo
        const updatedProducts = [...products];
        const [movedProduct] = updatedProducts[source.droppableId].products.splice(source.index, 1);
        updatedProducts[destination.droppableId].products.splice(destination.index, 0, movedProduct);

        setProducts(updatedProducts);

        // Aquí puedes actualizar el orden en tu base de datos si es necesario
    };

    if (loading) return (
        <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Container>
    );

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Lista de Productos
            </Typography>

            {/* Botón para mostrar el editor de descripción */}
            <Button
                onClick={() => setShowDescriptionEditor(!showDescriptionEditor)}
                variant="contained"
                color="primary"
                style={{ marginBottom: '1rem' }}
            >
                {showDescriptionEditor ? 'Cancelar' : 'Añadir Descripción del Negocio'}
            </Button>

            {/* Área de texto para la descripción del negocio */}
            {showDescriptionEditor && (
                <div className="description-editor">
                    <TextareaAutosize
                        minRows={3}
                        placeholder="Escribe aquí la descripción de tu negocio..."
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem' }}
                    />
                    <Button
                        onClick={handleDescriptionSave}
                        variant="contained"
                        color="secondary"
                    >
                        Guardar Descripción
                    </Button>
                </div>
            )}

            {/* Formulario para añadir producto */}
            <form onSubmit={handleAddProduct} className="add-product-form">
                <TextField
                    label="Línea"
                    name="linea"
                    value={newProduct.linea}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Medidas"
                    name="modelo"
                    value={newProduct.modelo}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Precio"
                    name="precio"
                    value={newProduct.precio}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Descripción"
                    name="descripcion"
                    value={newProduct.descripcion}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <div className="button-container">
                    <Button type="submit" variant="contained" color="primary">
                        Agregar Producto
                    </Button>
                </div>
            </form>

            {/* Formulario para editar producto */}
            {editProduct && (
                <form onSubmit={handleEditProduct} className="edit-product-form">
                    <TextField
                        label="Línea"
                        name="linea"
                        value={editProduct.linea}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Medidas"
                        name="modelo"
                        value={editProduct.modelo}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Precio"
                        name="precio"
                        value={editProduct.precio}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Descripción"
                        name="descripcion"
                        value={editProduct.descripcion}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <div className="button-container">
                        <Button type="submit" variant="contained" color="primary">
                            Guardar Cambios
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setEditProduct(null)}
                            variant="outlined"
                            color="secondary"
                            style={{ marginLeft: '1rem' }}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}

            {/* Drag and Drop Context */}
            <DragDropContext onDragEnd={handleOnDragEnd}>
                {products.map((group, groupIndex) => (
                    <Droppable droppableId={groupIndex.toString()} key={group.linea}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                <Typography variant="h5" style={{ marginTop: '2rem' }}>
                                    {group.products.every(p => p.descripcion && !p.linea && !p.modelo && !p.precio)
                                        ? 'Quienes Somos'
                                        : `Línea: ${group.linea}`}
                                </Typography>
                                <List>
                                    {group.products.map((product, index) => (
                                        <Draggable
                                            key={product.id}
                                            draggableId={product.id}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style, borderBottom: '1px solid #ddd', padding: '1rem 0' }}
                                                >
                                                    <div>
                                                        <Typography variant="h6">{product.linea}</Typography>
                                                        <Typography variant="body1"><strong>Medidas:</strong> {product.modelo}</Typography>
                                                        <Typography variant="body1"><strong>Precio:</strong> ${product.precio}</Typography>
                                                        <Typography variant="body1"><strong>Descripción:</strong> {product.descripcion}</Typography>
                                                        <Button
                                                            onClick={() => handleEditClick(product)}
                                                            variant="contained"
                                                            color="secondary"
                                                            style={{ marginRight: '1rem' }}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            variant="contained"
                                                            color="error"
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            </div>
                        )}
                    </Droppable>
                ))}
            </DragDropContext>
        </Container>
    );
};

export default ProductListPage;
