import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ContactPage from './page/home';
import ProductListPage from './page/editPrice';
import LoginForm from './page/login';

const App = () => { 
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ContactPage />} />
        <Route path="/editproducts" element={<ProductListPage />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
};

export default App;
