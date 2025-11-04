const { db } = require('./database/database');

// Función para recalcular pasivas del usuario
function recalculateUserPassives(userId, callback) {
  // Obtener todas las armas con pasivas del usuario
  db.all(`
    SELECT pasiva_tipo, pasiva_valor, pasiva_stackeable
    FROM inventory 
    WHERE user_id = ? AND pasiva_tipo IS NOT NULL
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Error obteniendo pasivas:', err);
      return callback(err);
    }
    
    // Calcular totales por tipo de pasiva
    const passiveTotals = {};
    let totalSuerte = 0;
    let totalGradeBonus = 0;
    
    rows.forEach(row => {
      const tipo = row.pasiva_tipo;
      let valor = 0;
      let suerte = 0;
      let gradeBonus = 0;
      const stackeable = row.pasiva_stackeable === 1;
      
      // El valor en pasiva_valor YA incluye el multiplicador de grado y conta aplicado
      // cuando se generó el arma, así que usamos directamente ese valor
      
      // Manejar pasivas complejas
      if (tipo === 'suerte_y_grade' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          suerte = pasivaData.suerte || 0;
          gradeBonus = pasivaData.gradeBonus || 0;
        } catch (e) {
          // Si no se puede parsear, usar valores por defecto
          suerte = 0;
          gradeBonus = 0;
        }
      } else if (tipo === 'suerte' && row.pasiva_valor) {
        // Pasiva simple de suerte
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          suerte = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          suerte = parseFloat(row.pasiva_valor || 0);
        }
      } else if (tipo === 'aumento_calidad' && row.pasiva_valor) {
        // DEPRECATED: aumento_calidad se convirtió a mayor_probabilidad_grado
        // Mantener por compatibilidad con armas antiguas
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          gradeBonus = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          gradeBonus = parseFloat(row.pasiva_valor || 0);
        }
      } else if (tipo === 'exp_extra' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.2 -> 20)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.2 -> 20)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (tipo === 'menor_costo_caja' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.5 -> 50)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.5 -> 50)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (tipo === 'mayor_costo_armas' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.07 -> 7)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.07 -> 7)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (tipo === 'dinero_por_segundo_porcentaje' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // El valor ya viene como número directo (ej: 2 para 2%)
          valor = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          valor = parseFloat(row.pasiva_valor || 0);
        }
      } else if (tipo === 'dinero_exp_compuesto' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Esta pasiva tiene dos componentes: dinero_por_segundo y exp_extra
          const dineroPorSegundo = parseFloat(pasivaData.dineroPorSegundo || 0);
          const expExtra = parseFloat(pasivaData.exp_extra || 0);
          
          // Añadir componentes a sus respectivos totales
          if (!passiveTotals['dinero_por_segundo']) passiveTotals['dinero_por_segundo'] = 0;
          if (!passiveTotals['exp_extra']) passiveTotals['exp_extra'] = 0;
          
          if (stackeable) {
            passiveTotals['dinero_por_segundo'] += dineroPorSegundo;
            passiveTotals['exp_extra'] += expExtra;
          } else {
            passiveTotals['dinero_por_segundo'] = Math.max(passiveTotals['dinero_por_segundo'], dineroPorSegundo);
            passiveTotals['exp_extra'] = Math.max(passiveTotals['exp_extra'], expExtra);
          }
          return; // Saltar el resto del procesamiento
        } catch (e) {
          console.error('Error procesando dinero_exp_compuesto:', e);
        }
      } else if (tipo === 'triple_pasiva' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Esta pasiva tiene tres componentes: suerte, mayor_probabilidad_grado, exp_extra
          const suerteVal = parseFloat(pasivaData.suerte || 0);
          const gradeVal = parseFloat(pasivaData.mayor_probabilidad_grado || 0);
          const expVal = parseFloat(pasivaData.exp_extra || 0);
          
          // Añadir componentes a sus respectivos totales
          if (!passiveTotals['exp_extra']) passiveTotals['exp_extra'] = 0;
          
          if (stackeable) {
            totalSuerte += suerteVal;
            totalGradeBonus += gradeVal;
            passiveTotals['exp_extra'] += expVal;
          } else {
            totalSuerte = Math.max(totalSuerte, suerteVal);
            totalGradeBonus = Math.max(totalGradeBonus, gradeVal);
            passiveTotals['exp_extra'] = Math.max(passiveTotals['exp_extra'], expVal);
          }
          return; // Saltar el resto del procesamiento
        } catch (e) {
          console.error('Error procesando triple_pasiva:', e);
        }
      } else if (row.pasiva_valor) {
        // Para otras pasivas simples (dinero_por_segundo, etc.)
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          valor = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          valor = parseFloat(row.pasiva_valor || 0);
        }
      } else {
        valor = parseFloat(row.pasiva_valor || 0);
      }
      
      if (!passiveTotals[tipo]) {
        passiveTotals[tipo] = 0;
      }
      
      if (stackeable) {
        // Si es stackeable, sumar todos los valores (ya multiplicados por grado y conta)
        passiveTotals[tipo] += valor;
      } else {
        // Si NO es stackeable, tomar el MÁXIMO valor (el que tiene mejor multiplicador)
        // Esto asegura que si tienes 3 armas con la misma pasiva no stackeable,
        // solo se aplica la que tiene el mayor valor (mejor grado/conta)
        passiveTotals[tipo] = Math.max(passiveTotals[tipo], valor);
      }
      
      // Sumar suerte y gradeBonus (no stackeables según la definición)
      if (tipo === 'suerte_y_grade') {
        totalSuerte = Math.max(totalSuerte, suerte);
        totalGradeBonus = Math.max(totalGradeBonus, gradeBonus);
      } else if (tipo === 'suerte') {
        totalSuerte = Math.max(totalSuerte, suerte);
      } else if (tipo === 'aumento_calidad') {
        // DEPRECATED: aumento_calidad ahora se maneja como mayor_probabilidad_grado
        totalGradeBonus = Math.max(totalGradeBonus, gradeBonus);
      }
    });
    
    // Actualizar la tabla users con los nuevos valores
    let dineroPorSegundo = passiveTotals['dinero_por_segundo'] || 0;
    const dineroPorSegundoPercent = passiveTotals['dinero_por_segundo_porcentaje'] || 0;
    const mayorCostoArmas = Math.round(passiveTotals['mayor_costo_armas'] || 0);
    const menorCostoCajas = passiveTotals['menor_costo_caja'] || 0;
    const mayorExpCaja = passiveTotals['exp_extra'] || 0;
    
    // Aplicar el porcentaje al dinero por segundo
    if (dineroPorSegundoPercent > 0) {
      dineroPorSegundo = dineroPorSegundo * (1 + dineroPorSegundoPercent / 100);
    }
    
    db.run('UPDATE users SET dinero_por_segundo = ?, dinero_por_segundo_porcentaje = ?, mayor_costo_armas = ?, menor_costo_cajas_percent = ?, suerte = ?, mayor_probabilidad_grado = ?, mayor_exp_caja_percent = ? WHERE id = ?', 
           [dineroPorSegundo, dineroPorSegundoPercent, mayorCostoArmas, menorCostoCajas, totalSuerte, totalGradeBonus, mayorExpCaja, userId], (updateErr) => {
      if (updateErr) {
        console.error('Error actualizando pasivas del usuario:', updateErr);
        return callback(updateErr);
      }
      
      console.log(`✅ Pasivas recalculadas para usuario ${userId}: dinero_por_segundo = ${dineroPorSegundo}, dinero_por_segundo_porcentaje = ${dineroPorSegundoPercent}%, mayor_costo_armas = ${mayorCostoArmas}%, suerte = ${totalSuerte}, mayor_probabilidad_grado = ${totalGradeBonus}, mayor_exp_caja = ${mayorExpCaja}% (de ${rows.length} items con pasivas)`);
      
      callback(null, passiveTotals);
    });
  });
}

// Recalcular pasivas para todos los usuarios
db.all('SELECT id FROM users', [], (err, users) => {
  if (err) {
    console.error('Error obteniendo usuarios:', err);
    db.close();
    return;
  }

  let completed = 0;
  const total = users.length;

  if (total === 0) {
    console.log('No hay usuarios para recalcular.');
    db.close();
    return;
  }

  users.forEach(user => {
    recalculateUserPassives(user.id, (recalcErr) => {
      completed++;
      if (recalcErr) {
        console.error(`Error recalculando pasivas para usuario ${user.id}:`, recalcErr);
      }

      if (completed === total) {
        console.log(`✅ Recálculo completado para ${total} usuarios.`);
        db.close();
      }
    });
  });
});