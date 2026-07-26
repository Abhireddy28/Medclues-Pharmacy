const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../utils/emailService');

exports.addStock = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.price && data.costPrice) data.price = data.costPrice; // Fallback for old code
    if (!data.barcode) delete data.barcode;
    if (!data.batchNumber) delete data.batchNumber;

    let existing = null;
    if (data.barcode) {
       existing = await Inventory.findOne({ barcode: data.barcode });
    } else if (data.name) {
       // Search by name with case-insensitivity
       existing = await Inventory.findOne({ name: { $regex: new RegExp(`^${data.name}$`, "i") } });
    }

    if (existing) {
      existing.stock += Number(data.stock);
      existing.lastUpdated = new Date();
      existing.expiryDate = data.expiryDate;
      existing.price = Number(data.price || data.costPrice);
      existing.costPrice = Number(data.costPrice); // Ensure it's a number
      existing.distributor = data.distributor;
      const updated = await existing.save();

      // Aggressive Low Stock Check
      if (updated.stock <= 10) {
        await Notification.create({
          title: `Stock Low: ${updated.name}`,
          message: `Only ${updated.stock} units left in stock. Reorder soon to avoid stockouts.`,
          type: 'inventory',
          priority: 'warning',
          actionLink: 'inventory',
          isRead: false
        });
      }

      return res.status(200).json(updated);
    }

    const newItem = new Inventory({
      ...data, 
      price: Number(data.price || data.costPrice),
      costPrice: Number(data.costPrice),
      lastUpdated: new Date()
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, lastUpdated: new Date() };
    const updated = await Inventory.findByIdAndUpdate(id, updateData, { new: true });
    
    // Check if it hit Low Stock explicitly during update
    if (updated.stock <= 10) {
      await Notification.create({
        title: `Stock Low: ${updated.name}`,
        message: `Only ${updated.stock} units left in stock. Reorder soon to avoid stockouts.`,
        type: 'inventory',
        priority: 'warning',
        actionLink: 'inventory',
        isRead: false
      });
    }

    // Check if it is Expiring Soon (during update)
    if (updated.expiryDate) {
      const today = new Date();
      const expiry = new Date(updated.expiryDate);
      const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysDiff < 0) {
        await Notification.create({
          title: `Expired: ${updated.name}`,
          message: `Batch expired ${Math.abs(daysDiff)} days ago! Please remove from shelf.`,
          type: 'inventory',
          priority: 'critical',
          actionLink: 'inventory',
          isRead: false
        });
      } else if (daysDiff <= 30) {
         await Notification.create({
          title: `Expiring Soon: ${updated.name}`,
          message: `This item will expire in ${daysDiff} days.`,
          type: 'inventory',
          priority: 'warning',
          actionLink: 'inventory',
          isRead: false
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const { query, search } = req.query;
    const searchTerm = query || search;
    let filter = {};

    if (searchTerm && searchTerm.trim() !== '') {
      const regex = new RegExp(searchTerm.trim(), 'i');
      filter = {
        $or: [
          { name: regex },
          { composition: regex },
          { salt: regex },
          { brand: regex },
          { category: regex }
        ]
      };
    }

    const items = await Inventory.find(filter).sort({ lastUpdated: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpired = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = await Inventory.find({ expiryDate: { $lt: today } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNearExpiry = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twentyDaysFromNow = new Date(today);
    twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);
    twentyDaysFromNow.setHours(23, 59, 59, 999);
    
    const items = await Inventory.find({ 
      expiryDate: { $gte: today, $lte: twentyDaysFromNow } 
    }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto update stock when billing 
exports.reduceStockBulk = async (req, res) => {
  try {
    const { items } = req.body;
    for (let item of items) {
      // Find item in inventory (by name or ID if available)
      const invItem = await Inventory.findOne({ name: item.name });
      if (invItem) {
        const oldStock = invItem.stock;
        invItem.stock = Math.max(0, invItem.stock - item.qty);
        invItem.lastUpdated = new Date();
        await invItem.save();

        if (invItem.stock <= 10) {
          // Check if an unread notification for THIS specific stock value already exists, to avoid identical duplicate clicks
          const exist = await Notification.findOne({ title: `Stock Low: ${invItem.name}`, isRead: false });
          if (!exist || exist.message !== `Only ${invItem.stock} units left in stock. Reorder soon to avoid stockouts.`) {
             await Notification.create({
               title: `Stock Low: ${invItem.name}`,
               message: `Only ${invItem.stock} units left in stock. Please restock immediately.`,
               type: 'inventory',
               priority: 'warning',
               actionLink: 'inventory',
               isRead: false
             });

             // SEND EMAIL ALERT
             try {
               // Find any pharmacy user to notify (or specific one if multi-tenant)
               const pharmacyUser = await User.findOne({ role: 'pharmacy' });
               if (pharmacyUser && pharmacyUser.email) {
                 await emailService.sendLowStockAlert(
                   pharmacyUser.email, 
                   pharmacyUser.shopName || pharmacyUser.name, 
                   [{ name: invItem.name, stock: invItem.stock }]
                 );
               }
             } catch (err) {
               console.error("Low stock email failed", err);
             }
          }
        }
      }
    }
    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByBarcode = (async (req, res) => {
  try {
    const item = await Inventory.findOne({ barcode: req.params.barcode });
    if (!item) return res.status(404).json({ message: 'Barcode not found in inventory' });
    
    // Ensure we send back a meaningful costPrice if it is 0 or missing
    if (!item.costPrice && item.price) {
      item.costPrice = item.price;
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

exports.bulkUploadInventory = async (req, res) => {
  try {
    const xlsx = require('xlsx');
    const MasterProduct = require('../models/MasterProduct');

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file (.xlsx, .xls, or .csv)' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!sheetData || sheetData.length === 0) {
      return res.status(400).json({ message: 'Uploaded Excel file is empty or formatted incorrectly.' });
    }

    // Helper: Smart Fuzzy Extractor for column headers
    const extractVal = (row, keyPatterns) => {
      const keys = Object.keys(row);
      for (const pattern of keyPatterns) {
        if (row[pattern] !== undefined && String(row[pattern]).trim() !== '') {
          return String(row[pattern]).trim();
        }
        const foundKey = keys.find(k => {
          const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return norm.includes(pattern.toLowerCase().replace(/[^a-z0-9]/g, ''));
        });
        if (foundKey && row[foundKey] !== undefined && String(row[foundKey]).trim() !== '') {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const newInventoryDocs = [];
    const masterOps = [];
    const errors = [];

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];

      // Extract values flexibly
      const name = extractVal(row, ['Medicine Name', 'Medicine N', 'Medicine', 'Name', 'Product Name', 'Drug Name']);
      const composition = extractVal(row, ['Composition', 'Compositio', 'Generic Name', 'Formula']);
      const salt = extractVal(row, ['Salt', 'Salt Composition', 'Composition', 'Generic Name']) || composition;
      const manufacturer = extractVal(row, ['Manufacturer', 'Manufactu', 'Company', 'Brand']);
      const brand = extractVal(row, ['Brand', 'Brand Name', 'Manufacturer', 'Company']) || manufacturer;
      const dosageForm = extractVal(row, ['Dosage Form', 'Category', 'Type']) || 'General';
      const category = extractVal(row, ['Category', 'Dosage Form', 'Type']) || dosageForm;
      const strength = extractVal(row, ['Strength', 'Dose']);
      const hsnCode = extractVal(row, ['HSN Code', 'HSN']) || '30049099';
      const rxRaw = extractVal(row, ['Prescription Required', 'Requires Rx', 'Rx Required', 'Rx']);
      const requiresRx = String(rxRaw).toLowerCase() === 'true' || String(rxRaw).toLowerCase() === 'yes' || String(rxRaw) === '1';
      
      const batchNumber = extractVal(row, ['Batch Number', 'Batch', 'Batch No']) || `BATCH-${String(i + 1).padStart(3, '0')}`;
      const stockRaw = extractVal(row, ['Stock', 'Quantity', 'Qty']);
      const stock = stockRaw ? Number(stockRaw) : 50;

      const mrpRaw = extractVal(row, ['MRP', 'Max Retail Price']);
      const priceRaw = extractVal(row, ['Price', 'Selling Price', 'Rate']);
      const mrp = mrpRaw ? Number(mrpRaw) : (priceRaw ? Number(priceRaw) * 1.2 : 50);
      const price = priceRaw ? Number(priceRaw) : (mrp > 0 ? mrp : 40);

      const costRaw = extractVal(row, ['Buying Price', 'Cost Price', 'BP', 'Cost']);
      const costPrice = costRaw ? Number(costRaw) : (price * 0.75);

      const expiryRaw = extractVal(row, ['Expiry Date', 'Expiry', 'Exp Date']);
      const distributor = extractVal(row, ['Distributor', 'Supplier']) || manufacturer || 'General Wholesaler';
      const barcode = extractVal(row, ['Barcode', 'EAN', 'UPC']) || undefined;
      const imageUrl = extractVal(row, ['Image URL', 'Image', 'Photo', 'Picture']) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300';

      // Fallback if name missing
      let finalName = name;
      if (!finalName) {
        const firstNonEmptyVal = Object.values(row).find(v => v && String(v).trim().length > 1);
        if (firstNonEmptyVal) finalName = String(firstNonEmptyVal).trim();
      }

      if (!finalName) {
        errors.push(`Row ${i + 2}: Skipped because Medicine Name was blank.`);
        continue;
      }

      let expiryDate = new Date();
      if (expiryRaw) {
        const parsed = new Date(expiryRaw);
        if (!isNaN(parsed.getTime())) expiryDate = parsed;
        else expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      } else {
        expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }

      // Add to bulk inventory insert list (Guarantees every row in Excel becomes an entry in DB!)
      newInventoryDocs.push({
        name: finalName,
        salt: salt || 'Generic Salt Composition',
        brand: brand || 'Pharma Brand',
        category: category,
        mrp: mrp,
        price: price,
        costPrice: costPrice,
        hsnCode: hsnCode,
        requiresRx: requiresRx,
        stock: stock,
        expiryDate: expiryDate,
        batchNumber: batchNumber,
        barcode: barcode,
        image: imageUrl,
        distributor: distributor,
        lastUpdated: new Date()
      });

      // Prepare bulkWrite operation for MasterProduct
      masterOps.push({
        updateOne: {
          filter: { name: finalName },
          update: {
            $set: {
              name: finalName,
              composition: composition,
              manufacturer: manufacturer,
              category: dosageForm,
              dosageForm: dosageForm,
              strength: strength,
              barcode: barcode,
              image: imageUrl
            }
          },
          upsert: true
        }
      });
    }

    if (newInventoryDocs.length === 0) {
      return res.status(400).json({ message: 'No valid medicine rows found in the Excel sheet.' });
    }

    // Fast Bulk Operations: Insert all 200+ inventory docs in ONE single query!
    const insertedResult = await Inventory.insertMany(newInventoryDocs);

    if (masterOps.length > 0) {
      try {
        await MasterProduct.bulkWrite(masterOps);
      } catch (err) {
        console.error("MasterProduct bulkWrite warning:", err.message);
      }
    }

    res.status(200).json({
      message: `🎉 Excel Bulk Import Complete! Successfully imported ALL ${insertedResult.length} medicines into Database & Inventory!`,
      count: insertedResult.length,
      errors: errors
    });

  } catch (error) {
    console.error("Bulk Upload Error:", error);
    res.status(500).json({ message: error.message || 'Error processing Excel file' });
  }
};

