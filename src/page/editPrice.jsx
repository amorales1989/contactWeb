import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress, Container, TextareaAutosize, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormControlLabel, Radio, RadioGroup, FormLabel } from '@mui/material';
import { supabase } from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './editPrice.css'; // Asegúrate de importar el archivo CSS
import { useLocation, useNavigate } from 'react-router-dom';

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingUser, setLoadingUser] = useState(true);
    const navigate = useNavigate();
    const [newProduct, setNewProduct] = useState({
        linea: '',
        modelo: '',
        precio: '',
        descripcion: '',
        image: null,
    });
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [businessDescription, setBusinessDescription] = useState('');
    const [minimumLoadingTimeElapsed, setMinimumLoadingTimeElapsed] = useState(false);
    const [openProfileModal, setOpenProfileModal] = useState(false);
    const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // Add state for the current user
    const [showProfileForm, setShowProfileForm] = useState(false); // Estado para controlar la visibilidad del formulario
    const [editUserData, setEditUserData] = useState(currentUser);
    const [newImage, setNewImage] = useState(null);

    const location = useLocation();

    useEffect(() => {
        fetchCurrentUser();
    }, [location.search]); // Depend on location.search to refetch if query params change

    useEffect(() => {
        if (currentUser) {
            fetchProducts();
            fetchBusinessDescription();
        }
        // Set a timeout to change the minimumLoadingTimeElapsed state after 3 seconds
        const timer = setTimeout(() => {
            setMinimumLoadingTimeElapsed(true);
        }, 3000);

        return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
    }, [currentUser]); // Depend on currentUser to fetch products and description

    const fetchCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Extract userId from URL query parameters
            const queryParams = new URLSearchParams(location.search);
            const userId = queryParams.get('id');

            if (userId) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Error fetching user information:', error);
        } finally {
            setLoadingUser(false); // Set loadingUser to false after fetching
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('socialReason', currentUser?.socialReason);
            if (error) throw error;

            const groupedProducts = data.reduce((groups, product) => {
                const { linea } = product;
                if (!groups[linea]) {
                    groups[linea] = [];
                }
                groups[linea].push(product);
                return groups;
            }, {});

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log(file)
        if (file) {
            // Crear una URL de objeto para mostrar la nueva imagen
            const imageUrl = URL.createObjectURL(file);
            setNewImage(imageUrl);
            // Aquí puedes manejar la carga del archivo, si es necesario
            // Por ejemplo: subirlo a un servidor o a un bucket
        }
        if (editProduct) {
            setEditProduct((prev) => ({
                ...prev,
                image: file, // Cambia `newImage` para la edición
            }));
        } else {
            setNewProduct((prev) => ({
                ...prev,
                image: file,
            }));
        }
       
    };
    console.log(newImage)

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
            let imageUrl = '';

            if (newProduct.image) {
                const fileName = encodeURIComponent(newProduct.image.name);
                console.log(fileName)
                const { data, error: uploadError } = await supabase
                    .storage
                    .from('product-image')
                    .upload(`public/${fileName}`, newProduct.image);

                if (uploadError) throw uploadError;

                imageUrl = `https://buzeesifyccipkpjgqwc.supabase.co/storage/v1/object/public/product-image/public/${fileName}`;
            }
            const { error } = await supabase
                .from('products')
                .insert([{
                    ...newProduct,
                    image: imageUrl,
                    socialReason: currentUser.socialReason
                }]);
            console.log(imageUrl)
            if (error) throw error;
            fetchProducts();
            setNewProduct({
                linea: '',
                modelo: '',
                precio: '',
                descripcion: '',
                image: null,
            });
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    console.log(currentUser)

    const handleEditProduct = async (e) => {
        e.preventDefault();

        if (!editProduct.linea || !editProduct.modelo || !editProduct.precio) {
            console.error('All fields are required');
            return;
        }

        try {
            let imageUrl = editProduct.image;
            if (imageUrl instanceof File) {
                // Upload new image if provided
                const fileName = encodeURIComponent(editProduct.image.name);
                const { data: listData, error: listError } = await supabase
                    .storage
                    .from('product-image')
                    .list('public/', { search: fileName });

                if (listError) throw listError;
                if (listData.length === 0) {
                    const { data, error: uploadError } = await supabase
                        .storage
                        .from('product-image')
                        .upload(`public/${fileName}`, editProduct.image);

                    if (uploadError) throw uploadError;

                    imageUrl = `https://buzeesifyccipkpjgqwc.supabase.co/storage/v1/object/public/product-image/public/${fileName}`;
                } else {
                    // Si el archivo ya existe, puedes manejarlo según lo necesites
                    imageUrl = `https://buzeesifyccipkpjgqwc.supabase.co/storage/v1/object/public/product-image/public/${fileName}`;
                }
            }

            const { error } = await supabase
                .from('products')
                .update({ ...editProduct, image: imageUrl })
                .eq('id', editProduct.id);

            if (error) throw error;
            fetchProducts();
            setEditProduct(null);
            setShowAddProductForm(false)
            setNewImage(''); 
        } catch (error) {
            console.error('Error updating product:', error);
        }
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

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            navigate('/login'); // Redirect to login page after successful logout
        }
    };

    const handleProfileClick = () => {
        setShowProfileForm(true); // Mostrar el formulario al tocar el botón de perfil
        setOpenProfileModal(true); // Asegúrate de abrir el modal
        setEditUserData(currentUser); // Inicializar el formulario con los datos actuales
    };

    const handleUserInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'infoNegocio') {
            setEditUserData((prevData) => ({
                ...prevData,
                [name]: name === 'infoNegocio' ? value === 'true' : value,
            }));
        } else if (name === 'galeria') {
            setEditUserData((prevData) => ({
                ...prevData,
                [name]: name === 'galeria' ? value === 'true' : value,
            }));
        } else {
            setEditUserData((prevData) => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleUserFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('users')
                .update(editUserData)
                .eq('id', currentUser.id);

            if (error) throw error;
            console.log('User data updated successfully');
            setShowProfileForm(false); // Ocultar el formulario tras guardar
            setCurrentUser(editUserData); // Actualizar los datos del usuario actual
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    };

    const handleEditClick = (product) => {
        setEditProduct(product);
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

    const handleRemoveImage = () => {
        setNewImage(null);
        // Opcionalmente, aquí puedes también limpiar el archivo seleccionado en el input
        document.querySelector('input[type="file"]').value = '';
    };
    const toggleAddProductForm = () => {
        setShowAddProductForm(!showAddProductForm);
    };

    const toggleEditProductForm = (e) => {
        setShowAddProductForm(e);
    };

    if (loading || loadingUser || !minimumLoadingTimeElapsed) return (
        <div class="center-body">
            <div class="loader-spanne-20">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );

    return (
        <Container>
            {currentUser && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2>Bienvenido a {currentUser.socialReason}</h2>
                        <h3>Usuario: {currentUser.usuario}</h3>
                        {/* You can display other user information here */}
                    </div>
                    <div>
                        <label class="popup">
                            <input type="checkbox" />
                            <div tabindex="0" class="burger">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    height="20"
                                    width="20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 2c2.757 0 5 2.243 5 5.001 0 2.756-2.243 5-5 5s-5-2.244-5-5c0-2.758 2.243-5.001 5-5.001zm0-2c-3.866 0-7 3.134-7 7.001 0 3.865 3.134 7 7 7s7-3.135 7-7c0-3.867-3.134-7.001-7-7.001zm6.369 13.353c-.497.498-1.057.931-1.658 1.302 2.872 1.874 4.378 5.083 4.972 7.346h-19.387c.572-2.29 2.058-5.503 4.973-7.358-.603-.374-1.162-.811-1.658-1.312-4.258 3.072-5.611 8.506-5.611 10.669h24c0-2.142-1.44-7.557-5.631-10.647z"
                                    ></path>
                                </svg>
                            </div>
                            <nav class="popup-window">
                                <ul>
                                    <li>
                                        <button onClick={handleProfileClick}>
                                            <span>Perfil</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={handleLogout}>
                                            <span>Salir</span>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </label>

                    </div>
                </div>
            )}
            {showProfileForm && (
                <Dialog open={openProfileModal} onClose={() => setOpenProfileModal(false)}>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogContent>
                        <form onSubmit={handleUserFormSubmit}>
                            <TextField
                                label="Razón social"
                                name="socialReason"
                                value={editUserData.socialReason || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                                disabled
                            />
                            <TextField
                                label="Email"
                                name="email"
                                value={editUserData.email || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Usuario"
                                name="usuario"
                                value={editUserData.usuario || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Contraseña"
                                name="password"
                                value={editUserData.password || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Telefono"
                                name="phone"
                                value={editUserData.phone || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Direccion"
                                name="direccion"
                                value={editUserData.direccion || ''}
                                onChange={handleUserInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <FormControl component="fieldset" margin="normal">
                                <div style={{ display: 'flex', justifyItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '70px' }}>
                                        <FormLabel>Quienes somos</FormLabel>
                                    </div>
                                    <div>
                                        <RadioGroup
                                            name="infoNegocio"
                                            value={editUserData.infoNegocio !== null ? (editUserData.infoNegocio ? 'true' : 'false') : ''}
                                            onChange={handleUserInputChange}
                                            row // This positions the radio buttons in a row
                                        >
                                            <FormControlLabel value="true" control={<Radio />} label="Sí" />
                                            <FormControlLabel value="false" control={<Radio />} label="No" />
                                        </RadioGroup>
                                    </div>
                                </div>
                            </FormControl>
                            <FormControl component="fieldset" margin="normal">
                                <div style={{ display: 'flex', justifyItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '130px' }}>
                                        <FormLabel>Galeria</FormLabel>
                                    </div>
                                    <div>
                                        <RadioGroup
                                            name="galeria"
                                            value={editUserData.galeria !== null ? (editUserData.galeria ? 'true' : 'false') : ''}
                                            onChange={handleUserInputChange}
                                            row // This positions the radio buttons in a row
                                        >
                                            <FormControlLabel value="true" control={<Radio />} label="Sí" />
                                            <FormControlLabel value="false" control={<Radio />} label="No" />
                                        </RadioGroup>
                                    </div>
                                </div>
                            </FormControl>

                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button type="submit" variant="contained" color="primary" onClick={handleUserFormSubmit}>
                            Guardar Cambios
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setOpenProfileModal(false)}
                            variant="outlined"
                            color="secondary"
                        >
                            Cancelar
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
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
            <Button variant="contained" color="primary" onClick={toggleAddProductForm}>
                {showAddProductForm ? 'Cancelar' : 'Añadir Producto'}
            </Button>

            {showAddProductForm && (
                <form onSubmit={editProduct ? handleEditProduct : handleAddProduct}>
                    <TextField
                        name="linea"
                        label="Línea"
                        value={editProduct ? editProduct.linea : newProduct.linea}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        name="modelo"
                        label="Modelo"
                        value={editProduct ? editProduct.modelo : newProduct.modelo}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        name="precio"
                        label="Precio"
                        type="number"
                        value={editProduct ? editProduct.precio : newProduct.precio}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextareaAutosize
                        name="descripcion"
                        placeholder="Descripción"
                        value={editProduct ? editProduct.descripcion : newProduct.descripcion}
                        onChange={handleInputChange}
                        style={{ width: '100%', margin: '10px 0', padding: '10px', borderRadius: '5px', fontFamily: 'serif', fontSize: 'medium' }}
                    />
                    <div style={{display: 'inline-grid', justifyContent:'center', justifyItems:'center'}}>
                    {newImage || editProduct?.image ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={newImage || editProduct?.image}
                        style={{ maxWidth: '100px', marginTop: '1rem' }}
                        alt="Product Preview"
                    />
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            background: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        X
                    </button>
                </div>
            ) : (
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            )}
                    <Button type="submit" variant="contained" color="primary">
                        {editProduct ? 'Actualizar Producto' : 'Añadir Producto'}
                    </Button>

                    </div>
                </form>
            )}

            {/* Formulario para editar producto */}
            {/* {editProduct && (
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
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ marginTop: '1rem' }}
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
            )} */}

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
                                                        {product.image && <img src={product.image} alt={product.linea} style={{ maxWidth: '100px', marginTop: '1rem' }} />}
                                                        <Button
                                                            onClick={() => {
                                                                const e = true
                                                                handleEditClick(product);
                                                                toggleEditProductForm(e); // Cambia el estado para mostrar el formulario
                                                            }}
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
