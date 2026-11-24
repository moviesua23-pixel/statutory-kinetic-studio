// -*- coding: utf-8 -*-
// static/js/icons.js
// Statutory Kinetic Studio - 24px Vector Icon Primitives
// 100% Vector Path2D icons with 1.5px uniform stroke & rounded caps. Zero canvas emojis.

(function() {
  const ICON_PATHS = {};

  // Initialize 24x24 Path2D vector templates
  function initIcons() {
    if (typeof Path2D === "undefined") return;

    // 1. User / Litigant / Taxpayer (Head + Shoulder Arc)
    const user = new Path2D();
    // Head circle (cx=12, cy=8, r=4)
    user.arc(12, 8, 4, 0, Math.PI * 2);
    // Shoulder arc (from 4, 20 to 20, 20)
    user.moveTo(4, 20);
    user.quadraticCurveTo(12, 14, 20, 20);
    ICON_PATHS["user"] = user;

    // 2. Building / Corporate Entity / Registered Office
    const bld = new Path2D();
    bld.rect(4, 3, 16, 18);
    // Door
    bld.moveTo(10, 21);
    bld.lineTo(10, 16);
    bld.lineTo(14, 16);
    bld.lineTo(14, 21);
    // Windows
    bld.moveTo(7, 7); bld.lineTo(9, 7);
    bld.moveTo(15, 7); bld.lineTo(17, 7);
    bld.moveTo(7, 11); bld.lineTo(9, 11);
    bld.moveTo(15, 11); bld.lineTo(17, 11);
    ICON_PATHS["building"] = bld;

    // 3. Store / Commercial Shop / Business Premises
    const store = new Path2D();
    store.moveTo(3, 8); store.lineTo(5, 3); store.lineTo(19, 3); store.lineTo(21, 8);
    store.lineTo(21, 20); store.lineTo(3, 20); store.closePath();
    store.moveTo(3, 8); store.lineTo(21, 8);
    store.moveTo(10, 20); store.lineTo(10, 14); store.lineTo(14, 14); store.lineTo(14, 20);
    ICON_PATHS["store"] = store;

    // 4. Scale of Justice / Balance
    const scale = new Path2D();
    // Central Pillar
    scale.moveTo(12, 3); scale.lineTo(12, 21);
    // Base
    scale.moveTo(7, 21); scale.lineTo(17, 21);
    // Crossbeam
    scale.moveTo(4, 7); scale.lineTo(20, 7);
    // Left Pan Suspension
    scale.moveTo(4, 7); scale.lineTo(2, 13);
    scale.moveTo(4, 7); scale.lineTo(6, 13);
    scale.moveTo(1, 13); scale.quadraticCurveTo(4, 16, 7, 13); scale.closePath();
    // Right Pan Suspension
    scale.moveTo(20, 7); scale.lineTo(18, 13);
    scale.moveTo(20, 7); scale.lineTo(22, 13);
    scale.moveTo(17, 13); scale.quadraticCurveTo(20, 16, 23, 13); scale.closePath();
    ICON_PATHS["scale"] = scale;

    // 5. Gavel / Courtroom Mallet
    const gavel = new Path2D();
    // Head angled
    gavel.moveTo(5, 7); gavel.lineTo(11, 3);
    gavel.lineTo(14, 6); gavel.lineTo(8, 10);
    gavel.closePath();
    // Handle
    gavel.moveTo(9, 8); gavel.lineTo(18, 17);
    // Sound Block Base
    gavel.moveTo(15, 21); gavel.lineTo(22, 21);
    ICON_PATHS["gavel"] = gavel;

    // 6. File Text / Statutory Deed / Document
    const file = new Path2D();
    file.moveTo(14, 3); file.lineTo(6, 3);
    file.lineTo(6, 21); file.lineTo(18, 21); file.lineTo(18, 7); file.closePath();
    file.moveTo(14, 3); file.lineTo(14, 7); file.lineTo(18, 7);
    // Text lines
    file.moveTo(9, 11); file.lineTo(15, 11);
    file.moveTo(9, 14); file.lineTo(15, 14);
    file.moveTo(9, 17); file.lineTo(13, 17);
    ICON_PATHS["fileText"] = file;

    // 7. Shield / Statutory Protection / Immunity
    const shield = new Path2D();
    shield.moveTo(12, 3);
    shield.lineTo(19, 6);
    shield.lineTo(19, 12);
    shield.quadraticCurveTo(19, 18, 12, 21);
    shield.quadraticCurveTo(5, 18, 5, 12);
    shield.lineTo(5, 6);
    shield.closePath();
    ICON_PATHS["shield"] = shield;

    // 8. Check Circle / Compliant / Valid
    const check = new Path2D();
    check.arc(12, 12, 9, 0, Math.PI * 2);
    check.moveTo(8, 12); check.lineTo(11, 15); check.lineTo(16, 9);
    ICON_PATHS["checkCircle"] = check;

    // 9. Alert Triangle / Breach / Defect
    const alert = new Path2D();
    alert.moveTo(12, 3); alert.lineTo(21, 19); alert.lineTo(3, 19); alert.closePath();
    alert.moveTo(12, 9); alert.lineTo(12, 13);
    alert.moveTo(12, 16); alert.arc(12, 16, 0.75, 0, Math.PI * 2);
    ICON_PATHS["alertTriangle"] = alert;

    // 10. Clock / Limitation Period / Deadline
    const clock = new Path2D();
    clock.arc(12, 12, 9, 0, Math.PI * 2);
    clock.moveTo(12, 7); clock.lineTo(12, 12); clock.lineTo(16, 12);
    ICON_PATHS["clock"] = clock;

    // 11. Truck / Goods Transport
    const truck = new Path2D();
    truck.rect(2, 6, 12, 10); // Trailer
    truck.moveTo(14, 9); truck.lineTo(19, 9); truck.lineTo(21, 12); truck.lineTo(21, 16); truck.lineTo(14, 16);
    // Wheels
    truck.moveTo(6, 17); truck.arc(6, 17, 2, 0, Math.PI * 2);
    truck.moveTo(17, 17); truck.arc(17, 17, 2, 0, Math.PI * 2);
    ICON_PATHS["truck"] = truck;

    // 12. Currency / Coin Token (Rupee / Dollar Token)
    const coin = new Path2D();
    coin.arc(12, 12, 9, 0, Math.PI * 2);
    coin.moveTo(9, 8); coin.lineTo(15, 8);
    coin.moveTo(9, 11); coin.lineTo(15, 11);
    coin.moveTo(10, 8); coin.lineTo(10, 14); coin.quadraticCurveTo(12, 14, 14, 12);
    coin.moveTo(11, 14); coin.lineTo(15, 17);
    ICON_PATHS["currency"] = coin;

    // 13. Key / Title Transfer / Deed Handover
    const key = new Path2D();
    key.arc(7, 12, 4, 0, Math.PI * 2);
    key.moveTo(11, 12); key.lineTo(20, 12);
    key.moveTo(16, 12); key.lineTo(16, 15);
    key.moveTo(19, 12); key.lineTo(19, 15);
    ICON_PATHS["key"] = key;

    // 14. Award / Landmark Precedent / Ratio Decidendi
    const award = new Path2D();
    award.arc(12, 8, 5, 0, Math.PI * 2);
    award.moveTo(8.5, 12); award.lineTo(7, 20); award.lineTo(12, 17); award.lineTo(17, 20); award.lineTo(15.5, 12);
    ICON_PATHS["award"] = award;

    // 15. Layers / Waterfall Flow / Stages
    const layers = new Path2D();
    layers.moveTo(12, 3); layers.lineTo(21, 8); layers.lineTo(12, 13); layers.lineTo(3, 8); layers.closePath();
    layers.moveTo(3, 12); layers.lineTo(12, 17); layers.lineTo(21, 12);
    layers.moveTo(3, 16); layers.lineTo(12, 21); layers.lineTo(21, 16);
    ICON_PATHS["layers"] = layers;

    // 16. Arrow Right
    const arrow = new Path2D();
    arrow.moveTo(4, 12); arrow.lineTo(20, 12);
    arrow.moveTo(14, 6); arrow.lineTo(20, 12); arrow.lineTo(14, 18);
    ICON_PATHS["arrowRight"] = arrow;

    // 17. Cross / Void / Non-Compliant
    const cross = new Path2D();
    cross.arc(12, 12, 9, 0, Math.PI * 2);
    cross.moveTo(8, 8); cross.lineTo(16, 16);
    cross.moveTo(16, 8); cross.lineTo(8, 16);
    ICON_PATHS["cross"] = cross;

    // 18. Sparkle / Focal Doctrine
    const sparkle = new Path2D();
    sparkle.moveTo(12, 3); sparkle.quadraticCurveTo(12, 12, 21, 12);
    sparkle.quadraticCurveTo(12, 12, 12, 21);
    sparkle.quadraticCurveTo(12, 12, 3, 12);
    sparkle.quadraticCurveTo(12, 12, 12, 3);
    ICON_PATHS["sparkle"] = sparkle;
  }

  // Pre-initialize
  initIcons();

  const ICONS = {
    /**
     * Draws a crisp 24x24 vector icon scaled to target size
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} name - e.g. 'user', 'scale', 'gavel'
     * @param {number} x - center X coordinate
     * @param {number} y - center Y coordinate
     * @param {number} size - target bounding box width/height (default 24)
     * @param {string} color - stroke color
     * @param {number} strokeWidth - stroke width (default 1.5)
     */
    draw(ctx, name, x, y, size = 24, color = "#0F172A", strokeWidth = 1.5) {
      const path = ICON_PATHS[name] || ICON_PATHS["fileText"];
      if (!path) return;

      ctx.save();
      ctx.translate(x - size / 2, y - size / 2);
      const scale = size / 24;
      ctx.scale(scale, scale);

      ctx.lineWidth = strokeWidth / scale;
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(path);

      ctx.restore();
    },

    get(name) {
      return ICON_PATHS[name] || ICON_PATHS["fileText"];
    }
  };

  // Expose to window
  window.ICONS = ICONS;
})();
