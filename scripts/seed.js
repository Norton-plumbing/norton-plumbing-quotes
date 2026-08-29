const postgres = require('postgres');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function seed() {
  try {
    console.log('Seeding database with initial data...');

    // Hash passwords
    const ownerPassword = await bcryptjs.hash('demo123', 10);
    const staffPassword = await bcryptjs.hash('demo123', 10);

    // Create owner
    const ownerResult = await sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES ('josh@norton-plumbing.com.au', 'Josh Norton', 'owner', ${ownerPassword})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    let ownerId = ownerResult[0]?.id || (await sql`SELECT id FROM users WHERE email = 'josh@norton-plumbing.com.au'`)[0].id;

    // Create office staff
    const officeResult = await sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES ('office@norton-plumbing.com.au', 'Office Staff', 'office', ${staffPassword})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    // Create estimator
    const estimatorResult = await sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES ('estimator@norton-plumbing.com.au', 'Estimator', 'estimator', ${staffPassword})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    // Create field staff (Tim)
    const fieldResult = await sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES ('tim@subcontractor.com.au', 'Tim', 'field', ${staffPassword})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    console.log('✅ Users created');

    // Create sample clients
    await sql`
      INSERT INTO clients (name, email, phone, address, suburb, postcode, state)
      VALUES 
        ('John Smith', 'john@example.com', '0412 345 678', '123 Main St', 'Walkerville', '5081', 'SA'),
        ('Sarah Johnson', 'sarah@example.com', '0412 987 654', '456 Oak Ave', 'Unley', '5061', 'SA'),
        ('Property Management Co', 'pm@example.com', '08 8123 4567', '789 Elizabeth St', 'Adelaide', '5000', 'SA')
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Sample clients created');

    // Create pricing defaults
    await sql`
      INSERT INTO pricing_defaults (
        plumber_cost_per_hour,
        plumber_sell_rate_per_hour,
        apprentice_cost_per_hour,
        apprentice_sell_rate_per_hour,
        material_markup_percent,
        subcontractor_markup_percent,
        equipment_markup_percent,
        updated_by_id
      ) VALUES (
        88.00,
        180.00,
        45.00,
        95.00,
        35,
        20,
        25,
        ${ownerId}
      )
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Pricing defaults created');

    // Create sample materials
    const materials = [
      { code: 'TAP-001', category: 'Valves & Brassware', desc: 'Brass Ball Tap 15mm', unit: 'each', cost: 25.00, markup: 35 },
      { code: 'TAP-002', category: 'Valves & Brassware', desc: 'Chrome Mixer Tap', unit: 'each', cost: 120.00, markup: 35 },
      { code: 'PIPE-001', category: 'Copper & Press Fittings', desc: 'Copper Pipe 15mm per meter', unit: 'm', cost: 8.50, markup: 35 },
      { code: 'FITTING-001', category: 'Copper & Press Fittings', desc: 'Elbow 15mm Press Fitting', unit: 'each', cost: 3.20, markup: 35 },
      { code: 'SEAL-001', category: 'Adhesives & Sealants', desc: 'PTFE Tape Roll', unit: 'roll', cost: 2.50, markup: 35 },
      { code: 'HW-001', category: 'Hot Water — Electric', desc: 'Electric Hot Water Service 50L', unit: 'each', cost: 650.00, markup: 35 },
      { code: 'DRAIN-001', category: 'Drainage & DWV', desc: 'PVC Pipe 100mm per meter', unit: 'm', cost: 12.00, markup: 35 },
    ];

    for (const mat of materials) {
      await sql`
        INSERT INTO materials (code, category, description, unit, cost_ex_gst, default_markup, supplier, active)
        VALUES (${mat.code}, ${mat.category}, ${mat.desc}, ${mat.unit}, ${mat.cost}, ${mat.markup}, 'Reece', true)
        ON CONFLICT (code) DO NOTHING
      `;
    }

    console.log('✅ Sample materials created');
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Demo credentials:');
    console.log('  Owner: josh@norton-plumbing.com.au / demo123');
    console.log('  Office: office@norton-plumbing.com.au / demo123');
    console.log('  Estimator: estimator@norton-plumbing.com.au / demo123');
    console.log('  Field: tim@subcontractor.com.au / demo123\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
