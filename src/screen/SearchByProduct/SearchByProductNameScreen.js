import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { debounce } from 'lodash';
import { showMessage } from 'react-native-flash-message';
import { appColors } from '../../component/Color';
import CustomHeader from '../../component/CustomHeader';
import CustomTextInput from '../../component/CustomTextInput';
import { ProductListByProductNameURL } from '../../component/URL';
import UnifiedPDFService from '../../component/UnifiedPDFService';
import UnifiedPDFButton from '../../component/UnifiedPDFButton';

class SearchByProductNameScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      loading: false,
      data: [],
      suggestions: [],
      error: null,
      showSuggestions: false,
      generatingPDF: false,
      pdfProgress: 0,
    };

    this.debouncedSearch = debounce(this.fetchSuggestions, 500);
  }

  componentWillUnmount() {
    this.debouncedSearch.cancel();
  }

  fetchSuggestions = async (searchTerm) => {
    if (searchTerm.trim() === '') {
      this.setState({ suggestions: [] });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const formData = new FormData();
      formData.append('name', searchTerm);

      const response = await axios.post(
        ProductListByProductNameURL,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (response.data.status && response.data.products) {
        this.setState({ suggestions: response.data.products });
      } else {
        this.setState({ suggestions: [] });
      }
    } catch (err) {
      this.setState({
        error: 'Failed to fetch suggestions. Please try again.',
        suggestions: [],
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleInputChange = (text) => {
    this.setState({ input: text, showSuggestions: true }, () => {
      this.debouncedSearch(text);
    });
  };

  handleSuggestionSelect = (item) => {
    this.setState({
      input: item.name,
      showSuggestions: false,
      data: [item],
    });
  };

  handleSearchPress = () => {
    const { input } = this.state;

    if (input.trim() === '') {
      showMessage({
        message: 'Input Required',
        description: 'Please enter a product name to search.',
        type: 'warning',
      });
      return;
    }

    this.setState(
      {
        loading: true,
        showSuggestions: false,
        data: [],
        error: null,
      },
      async () => {
        try {
          const formData = new FormData();
          formData.append('name', input.trim());

          const response = await axios.post(ProductListByProductNameURL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data.status && response.data.products) {
            this.setState({ data: response.data.products });
          } else {
            this.setState({ error: 'No products found.' });
          }
        } catch (err) {
          this.setState({
            error: 'Search failed. Please try again.',
          });
        } finally {
          this.setState({ loading: false });
        }
      }
    );
  };

  createUnifiedPDF = async () => {
    const { data, input } = this.state;

    if (!data || data.length === 0) {
      showMessage({
        message: 'No Data',
        description: 'No data available to generate PDF.',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    this.setState({ generatingPDF: true, pdfProgress: 0 });

    try {
      const result = await UnifiedPDFService.createUnifiedPDF(
        data,
        'Product Name Search Results',
        input,
        (progress) => this.setState({ pdfProgress: progress })
      );

      if (result) {
        console.log('PDF created successfully:', result);
      }
    } catch (error) {
      console.error('PDF creation error:', error);
    } finally {
      this.setState({ generatingPDF: false, pdfProgress: 0 });
    }
  };

  renderProductCard = ({ item }) => {
    const { navigation } = this.props;
    const { data } = this.state;
    const timestamp = Date.now();

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ProductDetail', {
            product: item,
            products: data,
            index: data.findIndex(p => p.id === item.id),
          })
        }
        style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.image_path
                ? `https://mtechsolution.org/${item?.image_path}?t=${timestamp}`
                : 'https://via.placeholder.com/100',
            }}
            style={styles.image}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>Product name : <Text style={styles.value}>{item?.name}</Text></Text>
          <Text style={styles.title}>Serial No. : <Text style={styles.value}>{item.sr_no}</Text></Text>
          <Text style={styles.title}>Series & Cross : <Text style={styles.value}>{item.series_and_cross}</Text></Text>
          <Text style={styles.title}>Vehicle : <Text style={styles.value}>{item.vehicle}</Text></Text>
        </View>
      </TouchableOpacity>
    );
  };

  renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => this.handleSuggestionSelect(item)}>
      <Text style={styles.suggestionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  render() {
    const {
      input,
      loading,
      data,
      suggestions,
      error,
      showSuggestions,
      generatingPDF,
      pdfProgress,
    } = this.state;

    return (
      <View style={styles.container}>
        <CustomHeader
          title={'Search Product By Name'}
          navigation={this.props.navigation}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.innerContainer}>
          
          <Text style={styles.label}>Enter Product Name</Text>
          <View style={styles.searchContainer}>
            <CustomTextInput
              value={input}
              onChangeText={this.handleInputChange}
              placeholder="Type here..."
              placeholderTextColor="black"
              onFocus={() => this.setState({ showSuggestions: true })}
              onBlur={() =>
                setTimeout(() => this.setState({ showSuggestions: false }), 200)
              }
            />

            {/* {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={this.renderSuggestionItem}
                  keyboardShouldPersistTaps="always"
                />
              </View>
            )} */}

            <TouchableOpacity style={styles.searchButton} onPress={this.handleSearchPress}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {loading ? (
            <ActivityIndicator size="large" color="#00AEEF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={this.renderProductCard}
              ListEmptyComponent={
                !loading && !showSuggestions && (
                  <Text style={styles.noData}>No products found.</Text>
                )
              }
              contentContainerStyle={{ paddingBottom: 100 }}
              style={{ flex: 1 }}
            />
          )}
        </KeyboardAvoidingView>

        {/* Fixed PDF Button at Bottom */}
        {data.length > 0 && (
          <View style={styles.fixedFooter}>
            <UnifiedPDFButton
              data={data}
              title="Generate PDF"
              searchQuery={input}
              onPress={this.createUnifiedPDF}
              generatingPDF={generatingPDF}
              pdfProgress={pdfProgress}
              disabled={data.length === 0}
            />
          </View>
        )}
      </View>
    );
  }
}

export default SearchByProductNameScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.bgColor,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  noData: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFD580',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Bold',
  },
  value: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFD580',
    borderRadius: 5,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 100,
    elevation: 3,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Bold',
  },
  searchButton: {
    backgroundColor: appColors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: appColors.white,
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: appColors.bgColor,
  },
});
