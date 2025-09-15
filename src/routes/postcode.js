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

/**
 * GET /mps_table
 * Get all MPs with their districts and associated postcodes
 */
router.get('/mps_table', async (req, res) => {
  try {
    // Query to get all MPs with their districts and postcodes
    const result = await db
      .select({
        mpId: mps.id,
        mpName: mps.name,
        mpParty: mps.party,
        mpPhone: mps.phoneNumber,
        districtId: districts.id,
        districtName: districts.name,
        districtNumber: districts.districtId,
        postcodeNumber: postcodes.postcodeNumber
      })
      .from(mps)
      .leftJoin(districts, eq(mps.id, districts.mpId))
      .leftJoin(postcodeDistricts, eq(districts.id, postcodeDistricts.districtId))
      .leftJoin(postcodes, eq(postcodeDistricts.postcodeId, postcodes.id))
      .orderBy(mps.name);

    // Group the results by MP
    const mpsMap = new Map();
    
    result.forEach(row => {
      if (!mpsMap.has(row.mpId)) {
        mpsMap.set(row.mpId, {
          id: row.mpId,
          name: row.mpName,
          party: row.mpParty,
          phoneNumber: row.mpPhone,
          district: row.districtName ? {
            id: row.districtId,
            name: row.districtName,
            number: row.districtNumber,
            postcodes: []
          } : null
        });
      }
      
      // Add postcode if it exists and district exists
      if (row.postcodeNumber && mpsMap.get(row.mpId).district) {
        const mp = mpsMap.get(row.mpId);
        if (!mp.district.postcodes.includes(row.postcodeNumber)) {
          mp.district.postcodes.push(row.postcodeNumber);
        }
      }
    });

    // Convert to array and sort postcodes
    const mpsData = Array.from(mpsMap.values()).map(mp => {
      if (mp.district && mp.district.postcodes.length > 0) {
        mp.district.postcodes.sort((a, b) => a - b);
      }
      return mp;
    });

    res.json({
      success: true,
      data: mpsData
    });

  } catch (error) {
    console.error('MPs table error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /mps_table_html
 * Serve HTML page for MPs table
 */
router.get('/mps_table_html', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Victorian MPs Directory</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #1e3a8a;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2rem;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .error {
            text-align: center;
            padding: 40px;
            color: #dc2626;
            background: #fef2f2;
            margin: 20px;
            border-radius: 4px;
        }
        .table-container {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f8fafc;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
            position: sticky;
            top: 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:hover {
            background: #f8fafc;
        }
        .mp-name {
            font-weight: 600;
            color: #1e40af;
        }
        .party {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .party.alp { background: #fef2f2; color: #dc2626; }
        .party.lp { background: #eff6ff; color: #2563eb; }
        .party.nationals { background: #f0fdf4; color: #16a34a; }
        .party.greens { background: #f0fdf4; color: #16a34a; }
        .party.independent { background: #f9fafb; color: #6b7280; }
        .phone {
            font-family: monospace;
            color: #059669;
        }
        .district-name {
            font-weight: 500;
            color: #374151;
        }
        .postcodes {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        .postcode {
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .stats {
            padding: 20px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        .stat {
            flex: 1;
        }
        .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e40af;
        }
        .stat-label {
            color: #64748b;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Victorian Legislative Assembly</h1>
            <p>Members of Parliament Directory with Districts and Postcodes</p>
        </div>
        
        <div id="content">
            <div class="loading">Loading MPs data...</div>
        </div>
        
        <div id="stats" class="stats" style="display: none;">
            <div class="stat">
                <div class="stat-number" id="total-mps">0</div>
                <div class="stat-label">Total MPs</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="total-districts">0</div>
                <div class="stat-label">Districts</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="total-postcodes">0</div>
                <div class="stat-label">Postcodes</div>
            </div>
        </div>
    </div>

    <script>
        async function loadMPsData() {
            try {
                const response = await fetch('/mps_table');
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to load data');
                }
                
                displayMPsTable(result.data);
                updateStats(result.data);
                
            } catch (error) {
                document.getElementById('content').innerHTML = \`
                    <div class="error">
                        <h3>Error Loading Data</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
        
        function displayMPsTable(mpsData) {
            const content = document.getElementById('content');
            
            const tableHTML = \`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>MP Name</th>
                                <th>Party</th>
                                <th>Phone</th>
                                <th>District</th>
                                <th>Postcodes</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${mpsData.map(mp => \`
                                <tr>
                                    <td class="mp-name">\${mp.name}</td>
                                    <td><span class="party \${mp.party.toLowerCase().replace(' ', '')}">\${mp.party}</span></td>
                                    <td class="phone">\${mp.phoneNumber || 'N/A'}</td>
                                    <td class="district-name">\${mp.district ? mp.district.name : 'No District'}</td>
                                    <td>
                                        \${mp.district && mp.district.postcodes.length > 0 
                                            ? \`<div class="postcodes">\${mp.district.postcodes.map(pc => \`<span class="postcode">\${pc}</span>\`).join('')}</div>\`
                                            : 'No Postcodes'
                                        }
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                </div>
            \`;
            
            content.innerHTML = tableHTML;
        }
        
        function updateStats(mpsData) {
            const totalMPs = mpsData.length;
            const totalDistricts = mpsData.filter(mp => mp.district).length;
            const totalPostcodes = new Set();
            
            mpsData.forEach(mp => {
                if (mp.district && mp.district.postcodes) {
                    mp.district.postcodes.forEach(pc => totalPostcodes.add(pc));
                }
            });
            
            document.getElementById('total-mps').textContent = totalMPs;
            document.getElementById('total-districts').textContent = totalDistricts;
            document.getElementById('total-postcodes').textContent = totalPostcodes.size;
            document.getElementById('stats').style.display = 'flex';
        }
        
        // Load data when page loads
        loadMPsData();
    </script>
</body>
</html>
  `);
});

export default router;