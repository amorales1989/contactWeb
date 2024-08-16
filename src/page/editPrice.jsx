import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress, Container, TextareaAutosize, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormControlLabel, Radio, RadioGroup, FormLabel, IconButton, AppBar, Toolbar } from '@mui/material';
import { supabase } from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './editPrice.css'; // Asegúrate de importar el archivo CSS
import { useLocation, useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import fondoApp from '../assets/fondoApp2.jpg';
import { styled } from '@mui/material/styles';
import { Card, CardContent } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

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
    const [isChecked, setIsChecked] = useState(false);
    const [imagenLogo, setImagenLogo] = useState(null);

    console.log(imagenLogo)

    const BlurredCard = styled(Card)(({ theme }) => ({
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        boxShadow: theme.shadows[5],
        backdropFilter: 'blur(10px)',  // Aplica el difuminado al fondo
        backgroundColor: 'rgba(255, 255, 255, 0.3)',  // Fondo semi-transparente para mejorar el contraste
        // Opcional: Ajusta el tamaño y el color del borde si es necesario
        border: '1px solid rgba(255, 255, 255, 0.5)',
    }));

    const BlurredCardContent = styled(CardContent)(({ theme }) => ({
        position: 'relative',
        zIndex: 1,  // Asegura que el contenido esté por encima del fondo difuminado
    }));

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
    }, [currentUser, imagenLogo]); // Depend on currentUser to fetch products and description

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
                setImagenLogo(data.logo)
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

    const [logoFile, setLogoFile] = useState(null);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileLogoChange = (e) => {
        const file = e.target.files[0];
        setLogoFile(file);

        // Generar URL de vista previa de la imagen
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };
    const userId = currentUser?.id
    console.log(currentUser)
    const handleUpload = async () => {
        if (logoFile && userId) {
            setLoadingUpload(true);
            console.log("ENTRO")
            try {
                let logoUrl = ''
                const fileName = encodeURIComponent(logoFile.name);

                // Verifica si ya existe un archivo con el mismo nombre
                const { data: listData, error: listError } = await supabase
                    .storage
                    .from('product-image')
                    .list('public/', { search: fileName });

                if (listError) throw listError;

                if (listData.length === 0) {
                    // Sube la imagen si no existe
                    const { data, error: uploadError } = await supabase
                        .storage
                        .from('product-image')
                        .upload(`public/${fileName}`, logoFile);

                    if (uploadError) throw uploadError;

                    logoUrl = `https://buzeesifyccipkpjgqwc.supabase.co/storage/v1/object/public/product-image/public/${fileName}`;

                } else {
                    logoUrl = `https://buzeesifyccipkpjgqwc.supabase.co/storage/v1/object/public/product-image/public/${fileName}`
                }
                // Guarda la URL del logo en la columna 'logo' de la tabla 'user'
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ logo: logoUrl })
                    .eq('id', userId); // Reemplaza con la lógica para obtener el ID del usuario actual

                if (updateError) throw updateError;

                alert('Logo subido y guardado con éxito!');
                window.location.reload();
            } catch (error) {
                console.error('Error al subir el logo:', error.message);
            } finally {
                setLoadingUpload(false)
            }
        }
    }
    const handleClear = () => {
        setLogoFile(null);
        setPreviewUrl(null);
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log(file)
        if (file) {
            // Crear una URL de objeto para mostrar la nueva imagen
            const imageUrl = URL.createObjectURL(file);
            setNewImage(imageUrl);
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
                view_gallery: isChecked,
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
                .update({ ...editProduct, image: imageUrl, view_gallery: isChecked })
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

    const handleDeleteLogo = async () => {
        try {
            const queryParams = new URLSearchParams(location.search);
            const userId = queryParams.get('id');
            // Actualizar el campo 'logo' a null para el usuario con el ID especificado
            const { error } = await supabase
                .from('users')
                .update({ logo: null })
                .eq('id', userId);

            if (error) throw error;

            // Opcional: Actualiza el estado local o realiza otras acciones necesarias
            console.log('Logo eliminado exitosamente.');
            // Aquí podrías actualizar el estado para reflejar que el logo ha sido eliminado
            setImagenLogo(null);
            window.location.reload();
        } catch (error) {
            console.error('Error deleting logo:', error);
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
console.log(currentUser)
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

    const handleChange = (event) => {
        setIsChecked(event.target.checked);
    };

    const handleRemoveImage = () => {
        setNewImage(null);
        if (editProduct) {
            // Actualizar el estado del producto para reflejar que no tiene imagen
            setEditProduct({ ...editProduct, image: null });
        }
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
        <Container
            sx={{
                backgroundImage: `url(${fondoApp})`,
                backgroundSize: 'cover',  // Asegura que la imagen cubra el contenedor
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',  // Repite la imagen en ambas direcciones si es necesario
                minHeight: '100vh',  // Asegura que el contenedor tenga al menos la altura de la pantalla
                overflow: 'auto',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(250, 250, 250, 0.4)', // Color con opacidad
                    zIndex: 1, // Asegura que esté por encima de la imagen de fondo
                },
                '& > *': {
                    position: 'relative',
                    zIndex: 2,  // Asegura que el contenido esté por encima de la capa de transparencia
                },
            }}
        >
            {currentUser && (
                <div >
                    <div>
                        <AppBar position="static" sx={{ backgroundColor: '#a1a1a1', marginBottom: '15px', zIndex: 9999, }} >
                            <Toolbar>
                                <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'start', fontSize: '25px' }}>
                                    {currentUser.socialReason}
                                <h5 style={{fontSize:'12px', display: 'table-cell'}}>usuario: {currentUser.usuario}</h5>
                                </Typography>
                                <LogoutIcon onClick={handleLogout}
                                style={{marginRight: '10px'}}/>
                                <IconButton
                                    onClick={handleProfileClick}
                                    edge="end"
                                    color="inherit"
                                    aria-label="profile"
                                >
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
                                       {/*  <nav class="popup-window">
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
                                        </nav> */}
                                    </label>

                                </IconButton>
                            </Toolbar>
                        </AppBar>
                    </div>
                </div>
            )}
            <BlurredCard>
                <BlurredCardContent>
                    <div>
                        <h3 style={{ margin: 'auto' }}>Logo:</h3>
                        {!loadingUpload && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                                {!imagenLogo ? (
                                    <>
                                        {!logoFile && (
                                            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <CloudUploadIcon style={{ fontSize: '48px', color: '#1976d2' }} />
                                                <span>Subir Logo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileLogoChange}
                                                    style={{ display: 'none' }} // Oculta el input real
                                                />
                                            </label>
                                        )}
                                        {previewUrl && <img src={previewUrl} alt="Vista previa del logo" style={{ maxWidth: '200px', marginTop: '10px' }} />}
                                        {logoFile && (
                                            <div>
                                                <Button
                                                    onClick={handleUpload}
                                                    disabled={loadingUpload}
                                                    variant="contained"
                                                    color="primary"
                                                    style={{ marginBottom: '15px', marginTop: '10px' }}
                                                >
                                                    Subir
                                                </Button>
                                                <Button
                                                    onClick={handleClear}
                                                    variant="contained"
                                                    color="secondary"
                                                    style={{ marginBottom: '15px', marginTop: '10px', marginLeft: '10px' }}
                                                >
                                                    Borrar
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <img src={imagenLogo} alt="Logo guardado" style={{ maxWidth: '200px', marginTop: '10px' }} />
                                        <IconButton
                                            onClick={handleDeleteLogo}
                                            color="red"
                                            style={{ marginTop: '10px' }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {loadingUpload && <div className="spinner"></div>}
                    </div>

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
                    {/* Botón para mostrar el editor de descripción */}
                    <div>
                        <Button
                            onClick={() => setShowDescriptionEditor(!showDescriptionEditor)}
                            variant="contained"
                            color="primary"
                            style={{ marginBottom: '1rem' }}
                        >
                            {showDescriptionEditor ? 'Cancelar' : 'Añadir Descripción del Negocio'}
                        </Button>
                        {showDescriptionEditor && (
                            <IconButton
                                sx={{ color: 'grey' }}
                                onClick={handleDescriptionSave}
                                aria-label="save"
                            >
                                <SaveIcon />
                            </IconButton>
                        )}
                    </div>
                    {/* Área de texto para la descripción del negocio */}
                    {showDescriptionEditor && (
                        <div className="description-editor">
                            <TextareaAutosize
                                minRows={3}
                                placeholder="Escribe aquí la descripción de tu negocio..."
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                style={{ width: '100%', marginBottom: '1rem', marginTop: '4px' }}
                            />
                        </div>
                    )}
                    <Typography variant="h4" gutterBottom>
                        Lista de Productos
                    </Typography>



                    {/* Formulario para añadir producto */}
                    <Button variant="contained" color="primary" onClick={toggleAddProductForm}>
                        {showAddProductForm ? 'Cancelar' : 'Añadir Producto'}
                    </Button>

                    {showAddProductForm && (
                        <form onSubmit={editProduct ? handleEditProduct : handleAddProduct} style={{ background: 'white', borderRadius: '7px', marginTop: '15px', padding: '15px' }}>
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
                                style={{
                                    width: '93%',
                                    background: 'white',
                                    borderColor: '#cacaca',
                                    margin: '10px 0',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    fontFamily: 'serif',
                                    fontSize: 'medium',
                                    color: 'black', // Color del texto
                                }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                                <div className="checkbox-wrapper-19">
                                    <input
                                        id="cbtest-19"
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={handleChange}
                                    />
                                    <label className="check-box" htmlFor="cbtest-19"></label>
                                </div>
                                <div>
                                    <label>Mostrar imagen en galeria</label>
                                </div>
                            </div>

                            <div style={{ display: 'inline-grid', justifyContent: 'center', justifyItems: 'center' }}>
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
                                            className="remove-button"
                                        >
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ marginBottom: '15px' }}
                                    />
                                )}
                                <Button type="submit" variant="contained" color="primary">
                                    {editProduct ? 'Actualizar Producto' : 'Añadir Producto'}
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
                                                            style={{ ...provided.draggableProps.style, borderBottom: '2px solid #4a3c3c', padding: '1rem 0' }}
                                                        >
                                                            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', width: '100%', marginBottom: '17px' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Typography variant="h6">{product.linea}</Typography>
                                                                            <Typography variant="body1"><strong>Medidas:</strong> {product.modelo}</Typography>
                                                                            <Typography variant="body1"><strong>Precio:</strong> ${product.precio}</Typography>
                                                                        </div>
                                                                        {product.image && (
                                                                            <div style={{ flexShrink: 0 }}>
                                                                                <img src={product.image} alt={product.linea} style={{ maxWidth: '100px', marginLeft: 'auto', marginTop: '1rem' }} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {product.descripcion && (
                                                                        <div>
                                                                            <Typography variant="body1"><strong>Descripción:</strong> {product.descripcion}</Typography>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div style={{display:'flex'}}>
                                                                    {/* <Button
                                                                        onClick={() => {
                                                                            const e = true
                                                                            handleEditClick(product);
                                                                            toggleEditProductForm(e);
                                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                        }}
                                                                        variant="contained"
                                                                        color="secondary"
                                                                        style={{ marginRight: '1rem' }}
                                                                    >
                                                                        Editar
                                                                    </Button> */}
                                                                    <button class="butto" onClick={() => {
                                                                            const e = true
                                                                            handleEditClick(product);
                                                                            toggleEditProductForm(e);
                                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                        }}
                                                                        style={{ marginRight: '1rem' }}>
                                                                        <span class="labl">Editar</span>
                                                                    </button>
                                                                    <button class="button" onClick={() => handleDeleteProduct(product.id)}>
                                                                        <span class="lable">Eliminar</span>
                                                                    </button>
                                                                    {/* <Button
                                                                        onClick={() => handleDeleteProduct(product.id)}
                                                                        variant="contained"
                                                                        color="error"
                                                                    >
                                                                        Eliminar
                                                                    </Button> */}
                                                                </div>

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
                </BlurredCardContent>
            </BlurredCard>
        </Container>
    );
};

export default ProductListPage;
