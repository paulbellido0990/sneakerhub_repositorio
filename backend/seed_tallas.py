import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.database import SessionLocal
    from app.models.product import VarianteColor, TallaStock
    print("✅ Conexión con los modelos de SneakerHub establecida con éxito.")
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    sys.exit(1)

def migrar_matriz_tallas():
    db = SessionLocal()
    tallas_nuevas = ["35", "36", "37"]
    registros_creados = 0

    try:
        variantes = db.query(VarianteColor).all()
        print(f"🔍 Analizando matriz de inventario para {len(variantes)} variantes en MySQL...")

        for variante in variantes:
            for talla in tallas_nuevas:
                existe = db.query(TallaStock).filter(
                    TallaStock.variante_color_id == variante.id,
                    TallaStock.talla == talla
                ).first()

                if not existe:
                    nuevo_registro = TallaStock(
                        variante_color_id=variante.id,
                        talla=talla,
                        stock=0
                    )
                    db.add(nuevo_registro)
                    registros_creados += 1

        if registros_creados > 0:
            db.commit()
            print(f"\n🚀 ¡MIGRACIÓN COMPLETADA CON ÉXITO!")
            print(f"📊 Se inyectaron {registros_creados} nuevos nodos de tallas (35, 36, 37) con stock inicial de 0 unidades.")
        else:
            print("\n✨ Toda la matriz de tallas ya se encontraba homologada. No se requirieron cambios.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error crítico durante la actualización en MySQL: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrar_matriz_tallas()