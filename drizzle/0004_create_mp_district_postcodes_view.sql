-- Create view for MPs with their districts and postcodes
CREATE VIEW mp_district_postcodes_view AS
SELECT 
  m.name as mp_name,
  m.party as mp_party,
  m.phone_number as mp_phone_number,
  d.name as district_name,
  COALESCE(
    JSON_AGG(p.postcode_number ORDER BY p.postcode_number)::text,
    '[]'
  ) as district_postcodes
FROM mps m
LEFT JOIN districts d ON m.id = d.mp_id
LEFT JOIN postcode_districts pd ON d.id = pd.district_id
LEFT JOIN postcodes p ON pd.postcode_id = p.id
GROUP BY m.id, m.name, m.party, m.phone_number, d.id, d.name
ORDER BY m.name, d.name;
