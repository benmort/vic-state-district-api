import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, postcodes, districts, mps, postcodeDistricts } from '../db/connection.js';

const router = Router();

/**
 * POST /postcode_lookup
 * Lookup district and MP information by postcode
 * 
 * Body: { postcode: string }
 * Response: { success: boolean, data?: object, error?: string }
 */
router.post('/postcode_lookup', async (req, res) => {
  try {
    const { postcode } = req.body;

    // Validate input
    if (!postcode) {
      return res.status(400).json({
        success: false,
        error: 'Postcode is required'
      });
    }

    // Clean and validate postcode format (Australian postcodes are 4 digits)
    const cleanPostcode = postcode.toString().trim();
    if (!/^\d{4}$/.test(cleanPostcode)) {
      return res.status(400).json({
        success: false,
        error: 'Postcode must be a 4-digit number'
      });
    }

    // Query the database for postcode information with joins
    const result = await db
      .select({
        postcode: postcodes.postcodeNumber,
        districtName: districts.name,
        districtId: districts.districtId,
        mpName: mps.name,
        mpParty: mps.party,
        mpPhone: mps.phoneNumber
      })
      .from(postcodes)
      .leftJoin(postcodeDistricts, eq(postcodes.id, postcodeDistricts.postcodeId))
      .leftJoin(districts, eq(postcodeDistricts.districtId, districts.id))
      .leftJoin(mps, eq(districts.mpId, mps.id))
      .where(eq(postcodes.postcodeNumber, parseInt(cleanPostcode)));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Postcode not found'
      });
    }

    const postcodeData = result[0];
    
    // Group districts by their ID to avoid duplicates
    const districtsMap = new Map();
    result.forEach(row => {
      if (row.districtId && !districtsMap.has(row.districtId)) {
        districtsMap.set(row.districtId, {
          name: row.districtName,
          id: row.districtId,
          mp: {
            name: row.mpName,
            party: row.mpParty,
            phoneNumber: row.mpPhone
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        postcode: postcodeData.postcode,
        districts: Array.from(districtsMap.values())
      }
    });

  } catch (error) {
    console.error('Postcode lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /postcode_lookup/:postcode
 * Alternative GET endpoint for postcode lookup
 */
router.get('/postcode_lookup/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;

    // Clean and validate postcode format
    const cleanPostcode = postcode.trim();
    if (!/^\d{4}$/.test(cleanPostcode)) {
      return res.status(400).json({
        success: false,
        error: 'Postcode must be a 4-digit number'
      });
    }

    // Query the database for postcode information with joins
    const result = await db
      .select({
        postcode: postcodes.postcodeNumber,
        districtName: districts.name,
        districtId: districts.districtId,
        mpName: mps.name,
        mpParty: mps.party,
        mpPhone: mps.phoneNumber
      })
      .from(postcodes)
      .leftJoin(postcodeDistricts, eq(postcodes.id, postcodeDistricts.postcodeId))
      .leftJoin(districts, eq(postcodeDistricts.districtId, districts.id))
      .leftJoin(mps, eq(districts.mpId, mps.id))
      .where(eq(postcodes.postcodeNumber, parseInt(cleanPostcode)));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Postcode not found'
      });
    }

    const postcodeData = result[0];
    
    // Group districts by their ID to avoid duplicates
    const districtsMap = new Map();
    result.forEach(row => {
      if (row.districtId && !districtsMap.has(row.districtId)) {
        districtsMap.set(row.districtId, {
          name: row.districtName,
          id: row.districtId,
          mp: {
            name: row.mpName,
            party: row.mpParty,
            phoneNumber: row.mpPhone
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        postcode: postcodeData.postcode,
        districts: Array.from(districtsMap.values())
      }
    });

  } catch (error) {
    console.error('Postcode lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;