import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react-native';
import { UserPreferencesService } from '@/services/user-preferences.service';

interface LocationSelectorProps {
  value: string;
  onChangeText: (value: string) => void;
  aiExtracted?: boolean;
  onAiExtractedChange?: () => void;
}

export function LocationSelector({ value, onChangeText, aiExtracted, onAiExtractedChange }: LocationSelectorProps) {
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const locations = await UserPreferencesService.getSavedLocations();
      setSavedLocations(locations);
    } catch (err) {
      console.error('Failed to load saved locations:', err);
    }
  };

  const handleSelectLocation = async (location: string) => {
    onChangeText(location);
    setShowDropdown(false);
    if (onAiExtractedChange) {
      onAiExtractedChange();
    }
  };

  const handleAddCustomLocation = async () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;

    try {
      const newLocations = await UserPreferencesService.addSavedLocation(trimmed);
      setSavedLocations(newLocations);
      onChangeText(trimmed);
      setCustomValue('');
      setShowCustomInput(false);
      setShowDropdown(false);
      if (onAiExtractedChange) {
        onAiExtractedChange();
      }
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  };

  const handleRemoveLocation = async (location: string) => {
    try {
      const newLocations = await UserPreferencesService.removeSavedLocation(location);
      setSavedLocations(newLocations);
      if (value === location) {
        onChangeText('');
      }
    } catch (err) {
      console.error('Failed to remove location:', err);
    }
  };

  return (
    <View>
      {savedLocations.length > 0 ? (
        <TouchableOpacity
          style={[styles.dropdownTrigger, aiExtracted && styles.dropdownTriggerAiExtracted]}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.7}>
          <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
            {value || 'Select or add location...'}
          </Text>
          <ChevronDown size={20} color="#718096" />
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.input, aiExtracted && styles.inputAiExtracted]}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (onAiExtractedChange) {
              onAiExtractedChange();
            }
          }}
          placeholder="e.g., Quest Diagnostics"
          placeholderTextColor="#A0AEC0"
        />
      )}

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownModal}>
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Lab / Location</Text>
                <TouchableOpacity onPress={() => setShowDropdown(false)}>
                  <X size={24} color="#4A5568" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.locationList}>
                {savedLocations.map((location) => (
                  <View key={location} style={styles.locationItem}>
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={() => handleSelectLocation(location)}
                      activeOpacity={0.7}>
                      <Text style={styles.locationText}>{location}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveLocation(location)}
                      activeOpacity={0.7}>
                      <X size={16} color="#E53E3E" />
                    </TouchableOpacity>
                  </View>
                ))}

                {savedLocations.length < 5 && (
                  <>
                    {!showCustomInput ? (
                      <TouchableOpacity
                        style={styles.addNewButton}
                        onPress={() => setShowCustomInput(true)}
                        activeOpacity={0.7}>
                        <Text style={styles.addNewButtonText}>+ Add New Location</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.customInputContainer}>
                        <TextInput
                          style={styles.customInput}
                          value={customValue}
                          onChangeText={setCustomValue}
                          placeholder="Enter location name..."
                          placeholderTextColor="#A0AEC0"
                          autoFocus
                        />
                        <View style={styles.customInputActions}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                              setShowCustomInput(false);
                              setCustomValue('');
                            }}
                            activeOpacity={0.7}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              !customValue.trim() && styles.addButtonDisabled,
                            ]}
                            onPress={handleAddCustomLocation}
                            disabled={!customValue.trim()}
                            activeOpacity={0.7}>
                            <Text style={styles.addButtonText}>Add</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {savedLocations.length >= 5 && (
                  <Text style={styles.maxLocationsText}>
                    Maximum 5 locations. Remove one to add another.
                  </Text>
                )}
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    backgroundColor: '#FFFFFF',
  },
  inputAiExtracted: {
    backgroundColor: '#FEFCBF',
    borderColor: '#ECC94B',
    borderWidth: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerAiExtracted: {
    backgroundColor: '#FEFCBF',
    borderColor: '#ECC94B',
    borderWidth: 2,
  },
  dropdownValue: {
    fontSize: 16,
    color: '#1A202C',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#A0AEC0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  locationList: {
    maxHeight: 400,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  locationButton: {
    flex: 1,
    padding: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#1A202C',
  },
  removeButton: {
    padding: 16,
  },
  addNewButton: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addNewButtonText: {
    fontSize: 16,
    color: '#4299E1',
    fontWeight: '500',
  },
  customInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  customInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4299E1',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  maxLocationsText: {
    padding: 16,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
});
