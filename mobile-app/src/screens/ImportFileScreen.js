import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, SecondaryButton, LoadingView, Badge } from '../components/UI';
import CategoryGrid from '../components/CategoryGrid';
import { useApp } from '../context/AppContext';
import { readSpreadsheetRows, buildImportCandidates, commitImportCandidates } from '../services/fileImportService';
import { looksLikeHeaderRow } from '../utils/importParsing';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

const FILE_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Mappatura predefinita per il formato di file abitualmente usato: colonna 1
// data, colonna 2 nota, colonna 6 categoria, colonna 8 importo (indici a
// base 0). Applicata in automatico se il file ha abbastanza colonne;
// resta comunque modificabile a mano per file con un formato diverso.
const DEFAULT_MAPPING = { dateCol: 0, descCol: 1, categoryCol: 5, amountCol: 7 };
const DEFAULT_MAPPING_MIN_COLUMNS = 8;

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
  const [autoMapped, setAutoMapped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [skippedInvalid, setSkippedInvalid] = useState(0);

  // Righe candidate calcolate ma non ancora scritte sul database: la revisione
  // avviene tutta qui, categoria compresa, prima di premere "Conferma import".
  const [candidates, setCandidates] = useState(null);
  const [categoriesByType, setCategoriesByType] = useState({ expense: [], income: [] });
  const [pickerForKey, setPickerForKey] = useState(null);

  const previewRows = useMemo(() => dataRows.slice(0, 4), [dataRows]);
  const includedCount = useMemo(() => (candidates || []).filter((c) => c.include).length, [candidates]);
  const duplicateCount = useMemo(() => (candidates || []).filter((c) => c.isDuplicate).length, [candidates]);

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
    setAutoMapped(false);
    setCandidates(null);
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

      if (width >= DEFAULT_MAPPING_MIN_COLUMNS) {
        setMode('signed');
        setDateCol(DEFAULT_MAPPING.dateCol);
        setDescCol(DEFAULT_MAPPING.descCol);
        setCategoryCol(DEFAULT_MAPPING.categoryCol);
        setAmountCol(DEFAULT_MAPPING.amountCol);
        setAutoMapped(true);
      }
    } catch (e) {
      Alert.alert('Errore lettura file', "Non riesco a leggere questo file. Assicurati sia un vero Excel (.xlsx) o CSV esportato dall'app della banca.");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  };

  const canBuild = dateCol != null && (mode === 'signed' ? amountCol != null : outCol != null || inCol != null);

  const handleBuildPreview = async () => {
    setBuilding(true);
    try {
      const mapping =
        mode === 'signed'
          ? { mode, dateCol, amountCol, descCol, categoryCol }
          : { mode, dateCol, outCol, inCol, descCol, categoryCol };
      const result = await buildImportCandidates({ rows: dataRows, mapping, sourceLabel: fileName || 'file' });
      if (result.candidates.length === 0) {
        Alert.alert(
          'Nessuna riga valida',
          `Nessuna delle ${dataRows.length} righe del file corrisponde alla mappatura scelta. Controlla le colonne selezionate.`
        );
        return;
      }
      setCandidates(result.candidates);
      setCategoriesByType(result.categoriesByType);
      setSkippedInvalid(result.skippedInvalid);
    } finally {
      setBuilding(false);
    }
  };

  const toggleInclude = (key) => {
    setCandidates((prev) => prev.map((c) => (c.key === key ? { ...c, include: !c.include } : c)));
  };

  const setCandidateCategory = (key, categoryId) => {
    setCandidates((prev) => prev.map((c) => (c.key === key ? { ...c, categoryId } : c)));
    setPickerForKey(null);
  };

  const handleConfirmImport = async () => {
    setCommitting(true);
    try {
      const stats = await commitImportCandidates(candidates);
      refresh();
      Alert.alert(
        'Import completato',
        `${stats.imported} operazioni aggiunte da confermare nella tab Movimenti.` +
          (stats.skipped > 0 ? `\n${stats.skipped} righe escluse o già presenti.` : ''),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Errore import', e.message || 'Qualcosa è andato storto durante il import.');
    } finally {
      setCommitting(false);
    }
  };

  const pickerCandidate = candidates?.find((c) => c.key === pickerForKey) || null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        {!candidates ? (
          <>
            <Text style={styles.description}>
              Scarica l'estratto conto o l'elenco movimenti in Excel/CSV dall'app della tua banca, poi selezionalo
              qui: nel passaggio successivo potrai vedere ogni riga, correggere la categoria e scegliere quali
              importare davvero, prima che finiscano nei Movimenti.
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
                  {autoMapped ? (
                    <Text style={[styles.hint, { marginBottom: SPACING.sm }]}>
                      Precompilata con la tua mappatura abituale (1 data, 2 nota, 6 categoria, 8 importo) — controllala
                      e correggila se questo file è diverso dal solito.
                    </Text>
                  ) : null}

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
                    descrizione; altrimenti resta "Altro" — nel prossimo passaggio potrai comunque correggerla riga
                    per riga prima di importare.
                  </Text>
                </View>

                <PrimaryButton
                  title={building ? 'Analisi in corso...' : `Rivedi ${dataRows.length} righe`}
                  onPress={handleBuildPreview}
                  disabled={!canBuild || building}
                  style={{ marginTop: SPACING.xl }}
                />
                <SecondaryButton title="Annulla" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.sm }} />
              </>
            ) : null}
          </>
        ) : (
          <>
            <SectionTitle subtitle="Correggi la categoria dove serve e deseleziona quello che non vuoi importare">
              Rivedi prima di importare
            </SectionTitle>
            <Text style={styles.hint}>
              {includedCount} selezionate su {candidates.length}
              {duplicateCount > 0 ? ` · ${duplicateCount} già presenti (deselezionate in automatico)` : ''}
              {skippedInvalid > 0 ? ` · ${skippedInvalid} righe del file ignorate (data/importo non validi)` : ''}
            </Text>

            <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
              {candidates.map((c) => {
                const catList = categoriesByType[c.type] || [];
                const category = catList.find((cat) => cat.id === c.categoryId);
                return (
                  <Card key={c.key} style={[styles.rowCard, !c.include && styles.rowCardExcluded]}>
                    <Pressable style={styles.rowCheckbox} onPress={() => toggleInclude(c.key)} hitSlop={8}>
                      <Ionicons
                        name={c.include ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={c.include ? COLORS.primary : COLORS.textMuted}
                      />
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <View style={styles.rowTopLine}>
                        <Text style={styles.rowDesc} numberOfLines={1}>
                          {c.description || c.categoryText || '(senza descrizione)'}
                        </Text>
                        <Text style={[styles.rowAmount, { color: c.type === 'expense' ? COLORS.negative : COLORS.positive }]}>
                          {c.type === 'expense' ? '-' : '+'}
                          {c.amount.toFixed(2)}€
                        </Text>
                      </View>
                      <View style={styles.rowBottomLine}>
                        <Text style={styles.rowDate}>{c.date}</Text>
                        {c.isDuplicate ? <Badge text="Già presente" color={COLORS.textSecondary} background={COLORS.background} /> : null}
                      </View>
                      <Pressable style={styles.categoryChip} onPress={() => setPickerForKey(c.key)}>
                        {category ? (
                          <Ionicons name={category.icon} size={14} color={category.color} style={{ marginRight: 4 }} />
                        ) : null}
                        <Text style={styles.categoryChipText} numberOfLines={1}>
                          {category?.name || 'Scegli categoria'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
            </View>

            <PrimaryButton
              title={committing ? 'Importazione...' : `Conferma import (${includedCount})`}
              onPress={handleConfirmImport}
              disabled={includedCount === 0 || committing}
              style={{ marginTop: SPACING.xl }}
            />
            <SecondaryButton
              title="Torna alla mappatura"
              onPress={() => setCandidates(null)}
              style={{ marginTop: SPACING.sm }}
            />
          </>
        )}
      </ScrollView>

      <Modal visible={!!pickerCandidate} animationType="slide" transparent onRequestClose={() => setPickerForKey(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerForKey(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Scegli categoria</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {pickerCandidate ? (
                <CategoryGrid
                  categories={categoriesByType[pickerCandidate.type] || []}
                  selectedId={pickerCandidate.categoryId}
                  onSelect={(id) => setCandidateCategory(pickerCandidate.key, id)}
                />
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  rowCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  rowCardExcluded: {
    opacity: 0.5,
  },
  rowCheckbox: {
    paddingTop: 2,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rowDesc: {
    flex: 1,
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rowAmount: {
    fontSize: FONT.small,
    fontWeight: '700',
  },
  rowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  rowDate: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  categoryChipText: {
    fontSize: FONT.tiny,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 160,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT.h3,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
});
