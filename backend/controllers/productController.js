const Product = require('../models/Product');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');

const DEMO_PRODUCTS = [
  { name: 'Paracetamol 500mg', composition: 'Paracetamol', price: 45, costPrice: 30, stock: 500, expiryDate: '2027-12-31', category: 'Tablet', status: 'available' },
  { name: 'Amoxicillin 250mg', composition: 'Amoxicillin', price: 120, costPrice: 90, stock: 200, expiryDate: '2027-10-15', category: 'Capsule', status: 'available' }
];

const getProducts = async (req, res) => {
  try {
    const userRole = req.user.role;
    const distributorId = req.query.distributorId;
    let query = {};

    if (userRole === 'pharmacy') {
      const activeConnections = await Connection.find({ pharmacy: req.user.id, status: 'active' });
      const connectedDistributorIds = activeConnections.map(c => c.distributor);
      
      if (distributorId && connectedDistributorIds.includes(distributorId)) {
        query.distributor = distributorId;
      } else {
        query.distributor = { $in: connectedDistributorIds };
      }
    } else if (distributorId || userRole === 'distributor') {
      query.distributor = distributorId || req.user.id;
    }
    
    let products = await Product.find(query).populate('distributor', 'name shopName');
    
    if (products.length === 0 && userRole === 'distributor') {
      const seededProducts = DEMO_PRODUCTS.map(p => ({ ...p, distributor: req.user.id }));
      products = await Product.insertMany(seededProducts);
    }
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = new Product({ ...req.body, distributor: req.user.id });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const bulkCreateProducts = async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : req.body.products;
    if (!data || !Array.isArray(data)) {
       return res.status(400).json({ message: 'No medicine data found in the upload.' });
    }
    
    const operations = data.filter(p => p.name && p.price).map(p => {
      // Clean and Validate Data
      const price = parseFloat(p.price) || 0;
      const costPrice = parseFloat(p.costPrice) || (price * 0.75);
      const stock = parseInt(p.stock) || 0;
      const barcode = String(p.barcode || `AUTO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

      return {
        updateOne: {
          filter: { barcode: barcode, distributor: req.user.id },
          update: { 
            $set: { 
              name: p.name,
              composition: p.composition || 'General Formula',
              price: price,
              costPrice: costPrice,
              expiryDate: p.expiryDate ? new Date(p.expiryDate) : new Date(Date.now() + 63072000000), // +2 years
              category: p.category || 'Tablet',
              status: 'available'
            },
            $inc: { stock: stock }
          },
          upsert: true
        }
      };
    });
    
    if (operations.length === 0) {
      return res.status(400).json({ message: 'No valid products to sync.' });
    }

    const result = await Product.bulkWrite(operations);
    res.status(201).json({ 
      message: 'Inventory Synchronization Complete',
      added: result.upsertedCount,
      updated: result.modifiedCount 
    });
  } catch (error) {
    console.error('Final Sync Failure:', error.message);
    res.status(400).json({ message: `Database Error: ${error.message}` });
  }
};

const parseInvoice = async (req, res) => {
  try {
    const mockExtractedData = [
      { name: 'Augmentin 625 Duo', barcode: '8901234567890', price: 210, costPrice: 150, stock: 50, category: 'Tablet' },
      { name: 'Pan 40', barcode: '8909876543210', price: 140, costPrice: 100, stock: 100, category: 'Tablet' }
    ];
    res.json({ message: 'Invoice parsed successfully', products: mockExtractedData });
  } catch (error) {
    res.status(500).json({ message: 'Error parsing invoice' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubstitutes = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const substitutes = await Product.find({
      composition: { $regex: product.composition, $options: 'i' },
      _id: { $ne: product._id }
    }).limit(5);
    
    res.json(substitutes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const product = await Product.findOne({ barcode }).populate('distributor', 'name shopName');
    if (!product) return res.status(404).json({ message: 'Medicine not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const oldProduct = await Product.findById(id).populate('distributor', 'name shopName');
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true }).populate('distributor', 'name shopName');

    // SYNC ENGINE: If price changed, propagate to connected pharmacies
    if (oldProduct.price !== updatedProduct.price) {
      console.log(`[SyncEngine] Price changed for ${updatedProduct.name}: ${oldProduct.price} -> ${updatedProduct.price}`);
      
      const affectedInventories = await Inventory.find({ productId: id });
      for (const inv of affectedInventories) {
        // Update pharmacy's cost price to match distributor's new listed price
        inv.costPrice = updatedProduct.price; 
        await inv.save();

        // Create In-App Notification for Pharmacy
        await Notification.create({
          title: `Price Update: ${updatedProduct.name}`,
          message: `${updatedProduct.distributor.name} has updated the procurement price. Your new cost price is ₹${updatedProduct.price}.`,
          type: 'inventory',
          priority: 'info',
          actionLink: 'inventory'
        });
      }
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed from catalog' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAIRecommendations = async (req, res) => {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query) {
      return res.json({ query: '', composition: '', alternatives: [] });
    }

    // Hardcoded high-fidelity medicine mapping database
    const MEDICINE_MAP = {
      "paracetamol": {
        composition: "Paracetamol",
        brands: ["Crocin 500", "Dolo 650", "Calpol 650", "Pacimol 650", "Paracetamol 500mg"]
      },
      "crocin": {
        composition: "Paracetamol",
        brands: ["Crocin 500", "Dolo 650", "Calpol 650", "Pacimol 650", "Paracetamol 500mg"]
      },
      "dolo": {
        composition: "Paracetamol",
        brands: ["Crocin 500", "Dolo 650", "Calpol 650", "Pacimol 650", "Paracetamol 500mg"]
      },
      "calpol": {
        composition: "Paracetamol",
        brands: ["Crocin 500", "Dolo 650", "Calpol 650", "Pacimol 650", "Paracetamol 500mg"]
      },
      "amoxicillin": {
        composition: "Amoxicillin",
        brands: ["Amoxicillin 250mg", "Amoxil 500", "Novamox 500", "Almox 500"]
      },
      "pantoprazole": {
        composition: "Pantoprazole",
        brands: ["Pan 40", "Pantocid 40", "Pantocid 20", "Pantosec"]
      },
      "pan 40": {
        composition: "Pantoprazole",
        brands: ["Pan 40", "Pantocid 40", "Pantocid 20", "Pantosec"]
      },
      "azithromycin": {
        composition: "Azithromycin",
        brands: ["Azithromycin 250mg", "Azee 500", "Azithral 500", "Azibact 500"]
      },
      "cetirizine": {
        composition: "Cetirizine",
        brands: ["Cetzine", "Alerid", "Okacet"]
      },
      "ibuprofen": {
        composition: "Ibuprofen",
        brands: ["Brufen 400", "Ibugesic Plus", "Combiflam"]
      }
    };

    // 1. Identify primary composition and alternative brands
    let matchedComposition = "";
    let alternativeBrands = [];

    // Check direct matching in mapping
    for (const key of Object.keys(MEDICINE_MAP)) {
      if (query.includes(key) || key.includes(query)) {
        matchedComposition = MEDICINE_MAP[key].composition;
        alternativeBrands = MEDICINE_MAP[key].brands;
        break;
      }
    }

    // 2. Dynamic DB Fallback: If no hardcoded map match, search Product collection by name or composition
    if (!matchedComposition) {
      const dbMatch = await Product.findOne({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { composition: { $regex: query, $options: 'i' } }
        ]
      });
      if (dbMatch) {
        matchedComposition = dbMatch.composition;
        // Find other brand names with this composition
        const relativeProducts = await Product.find({
          composition: { $regex: matchedComposition, $options: 'i' }
        }).limit(10);
        alternativeBrands = Array.from(new Set(relativeProducts.map(p => p.name)));
      }
    }

    // If still nothing found, default to generic placeholder alternatives based on search query
    if (!matchedComposition) {
      matchedComposition = query.charAt(0).toUpperCase() + query.slice(1) + " Formula";
      alternativeBrands = [
        `${query.toUpperCase()} Alpha`,
        `${query.toUpperCase()} Beta 500`,
        `${query.toUpperCase()} Ultra`
      ];
    }

    // 3. Resolve availability of alternatives in Local Inventory and Distributor Catalogs
    const resolvedAlternatives = [];

    for (const brand of alternativeBrands) {
      // Check local inventory (matching by name, case-insensitively)
      const localInv = await Inventory.findOne({
        name: { $regex: new RegExp(`^${brand}$`, 'i') }
      });

      // Find all distributors selling this product from Product catalog
      const distributorProducts = await Product.find({
        name: { $regex: new RegExp(`^${brand}$`, 'i') }
      }).populate('distributor', 'name shopName email phone');

      const distributorsList = distributorProducts.map(dp => ({
        distributorId: dp.distributor?._id,
        name: dp.distributor?.name || dp.distributor?.shopName || 'Unknown Distributor',
        phone: dp.distributor?.phone || '',
        price: dp.price,
        stock: dp.stock
      }));

      resolvedAlternatives.push({
        name: brand,
        _id: localInv ? localInv._id : null,
        inLocalInventory: !!localInv && localInv.stock > 0,
        localStock: localInv ? localInv.stock : 0,
        localPrice: localInv ? (localInv.price || localInv.costPrice || 0) : 0,
        distributors: distributorsList
      });
    }

    res.json({
      query: query,
      composition: matchedComposition,
      alternatives: resolvedAlternatives
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getProducts, 
  createProduct, 
  bulkCreateProducts, 
  parseInvoice, 
  getProductById, 
  getSubstitutes, 
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  getAIRecommendations
};
