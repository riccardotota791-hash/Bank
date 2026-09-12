import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, SecondaryButton, LoadingView } from '../components/UI';
import { useApp } from '../context/AppContext';
import { readSpreadsheetRows, importMappedRows } from '../services/fileImportService';
import { looksLikeHeaderRow } from '../utils/importParsing';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

const FILE_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function ImportFileScreen({ navigation }) {
  const { refresh } = useApp();
  const [fileName, setFileName] = useState(null);
  const [columns, setColumns] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [mode, setMode] = useState('signed');
  const [dateCol, setDateCol] = useState(null);
  const [amountCol, setAmountCol] = useState(null);
  const [outCol, setOutCol] = useState(null);
  const [inCol, setInCol] = useState(null);
  const [descCol, setDescCol] = useState(null);
  const [categoryCol, setCategoryCol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const previewRows = useMemo(() => dataRows.slice(0, 4), [dataRows]);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: FILE_TYPES, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLoading(true);
    setFileName(asset.name);
    setDateCol(null);
    setAmountCol(null);
    setOutCol(null);
    setInCol(null);
    setDescCol(null);
    setCategoryCol(null);
    try {
      const rows = await readSpreadsheetRows(asset.uri);
      if (!rows || rows.length === 0) {
        Alert.alert('File vuoto', 'Non ho trovato righe leggibili in questo file.');
        return;
      }
      const hasHeader = looksLikeHeaderRow(rows[0]);
      const width = Math.max(...rows.map((r) => r.length));
      const labels = hasHeader
        ? Array.from({ length: width }, (_, i) => String(rows[0][i] ?? `Colonna ${i + 1}`).trim() || `Colonna ${i + 1}`)
        : Array.from({ length: width }, (_, i) => `Colonna ${i + 1}`);
      setColumns(labels);
      setDataRows(hasHeader ? rows.slice(1) : rows);
    } catch (e) {
      Alert.alert('Errore lettura file', "Non riesco a leggere questo file. Assicurati sia un vero Excel (.xlsx) o CSV esportato dall'app della banca.");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  };

  const canImport = dateCol != null && (mode === 'signed' ? amountCol != null : outCol != null || inCol != null);

  const handleImport = async () => {
    setImporting(true);
    try {
      const mapping =
        mode === 'signed'
          ? { mode, dateCol, amountCol, descCol, categoryCol }
          : { mode, dateCol, outCol, inCol, descCol, categoryCol };
      const stats = await importMappedRows({ rows: dataRows, mapping, sourceLabel: fileName || 'file' });
      refresh();
      Alert.alert(
        'Import completato',
        `${stats.imported} nuove operazioni trovate, da confermare nella tab Movimenti.\n` +
          `${stats.skippedDuplicate} già presenti (ignorate), ${stats.skippedInvalid} righe non riconosciute.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Errore import', e.message || 'Qualcosa è andato storto durante il import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Scarica l'estratto conto o l'elenco movimenti in Excel/CSV dall'app della tua banca, poi selezionalo qui:
          l'app riconosce solo le operazioni non ancora presenti e te le propone da confermare nella tab Movimenti,
          esattamente come per l'import da Gmail.
        </Text>

        <PrimaryButton
          title={fileName ? `File: ${fileName}` : 'Seleziona file (Excel/CSV)'}
          onPress={handlePickFile}
          style={{ marginTop: SPACING.lg }}
          icon={<Ionicons name="document-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />}
        />

        {loading ? <LoadingView label="Lettura file..." /> : null}

        {columns.length > 0 && !loading ? (
          <>
            <View style={{ marginTop: SPACING.xl }}>
              <SectionTitle subtitle="Le prime righe del file, per aiutarti a riconoscere le colonne">Anteprima</SectionTitle>
              <Card style={{ padding: 0 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.previewRow}>
                      {columns.map((c, i) => (
                        <Text key={i} style={[styles.previewCell, styles.previewHeaderCell]} numberOfLines={1}>
                          {c}
                        </Text>
                      ))}
                    </View>
                    {previewRows.map((row, r) => (
                      <View key={r} style={styles.previewRow}>
                        {columns.map((_, i) => (
                          <Text key={i} style={styles.previewCell} numberOfLines={1}>
                            {String(row[i] ?? '')}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </Card>
            </View>

            <View style={{ marginTop: SPACING.xl }}>
              <SectionTitle subtitle="Dimmi quale colonna contiene cosa">Mappatura colonne</SectionTitle>

              <Text style={styles.fieldLabel}>Colonna Data</Text>
              <ColumnChips columns={columns} selected={dateCol} onSelect={setDateCol} />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Entrate/uscite in due colonne separate</Text>
                <Switch
                  value={mode === 'split'}
                  onValueChange={(v) => setMode(v ? 'split' : 'signed')}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>

              {mode === 'signed' ? (
                <>
                  <Text style={styles.fieldLabel}>Colonna Importo (negativo = uscita, positivo = entrata)</Text>
                  <ColumnChips columns={columns} selected={amountCol} onSelect={setAmountCol} />
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Colonna Uscite / Addebiti</Text>
                  <ColumnChips columns={columns} selected={outCol} onSelect={setOutCol} />
                  <Text style={styles.fieldLabel}>Colonna Entrate / Accrediti</Text>
                  <ColumnChips columns={columns} selected={inCol} onSelect={setInCol} />
                </>
              )}

              <Text style={styles.fieldLabel}>Colonna Descrizione (opzionale, diventa la nota)</Text>
              <ColumnChips columns={columns} selected={descCol} onSelect={setDescCol} />

              <Text style={styles.fieldLabel}>Colonna Categoria (opzionale, se il file la indica già)</Text>
              <ColumnChips columns={columns} selected={categoryCol} onSelect={setCategoryCol} />
              <Text style={styles.hint}>
                Se non la mappi, o non trovo corrispondenza, provo comunque a indovinare la categoria dalla
                descrizione (supermercati, ristoranti, trasporti, abbonamenti...); altrimenti resta "Altro" e la
                sistemi tu dopo aver confermato il movimento.
              </Text>
            </View>

            <PrimaryButton
              title={importing ? 'Importazione...' : `Importa ${dataRows.length} righe`}
              onPress={handleImport}
              disabled={!canImport || importing}
              style={{ marginTop: SPACING.xl }}
            />
            <SecondaryButton title="Annulla" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.sm }} />
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function ColumnChips({ columns, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
      <View style={styles.chipRow}>
        {columns.map((label, i) => (
          <Pressable
            key={i}
            onPress={() => onSelect(selected === i ? null : i)}
            style={[styles.chip, selected === i && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected === i && styles.chipTextSelected]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  description: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  hint: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: -SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 160,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.tiny,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewCell: {
    width: 110,
    padding: SPACING.sm,
    fontSize: FONT.tiny,
    color: COLORS.textPrimary,
  },
  previewHeaderCell: {
    fontWeight: '800',
    backgroundColor: COLORS.primaryLight,
  },
});
