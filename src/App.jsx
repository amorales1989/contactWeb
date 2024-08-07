import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ContactPage from './page/home';
import ProductListPage from './page/editPrice';

const App = () => { 
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ContactPage />} />
        <Route path="/editproducts" element={<ProductListPage />} />
      </Routes>
    </Router>
  );
};

export default App;
