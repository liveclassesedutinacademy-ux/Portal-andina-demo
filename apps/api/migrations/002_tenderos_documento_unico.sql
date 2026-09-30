-- HU-101: un tendero se identifica por su tipo y número de documento.
CREATE UNIQUE INDEX IF NOT EXISTS tenderos_documento_unico ON tenderos (tipo_documento, numero_documento);
