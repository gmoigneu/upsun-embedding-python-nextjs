export function toMarkdown(watch: Watch) {
  return `
  ## ${watch.brand} ${watch.model}
  
  - Brand: ${watch.brand}
  - Model: ${watch.model}
  - Case Material: ${watch.case_material}
  - Strap Material: ${watch.strap_material}
  - Movement Type: ${watch.movement_type}
  - Water Resistance: ${watch.water_resistance}
  - Case Diameter: ${watch.case_diameter_mm}mm
  - Case Thickness: ${watch.case_thickness_mm}mm
  - Band Width: ${watch.band_width_mm}mm
  - Dial Color: ${watch.dial_color}
  - Crystal Material: ${watch.crystal_material}
  - Complications: ${watch.complications}
  - Power Reserve: ${watch.power_reserve}
  - Price: $${watch.price_usd}
  `;
}

export function extract(watch: Watch) {
  return `
  - Name: ${watch.brand} ${watch.model}
  - Movement Type: ${watch.movement_type}
  - Dial Color: ${watch.dial_color}
  - Price: $${watch.price_usd}
  `;
}