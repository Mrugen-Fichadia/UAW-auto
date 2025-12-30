import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { NavigationContext } from '@react-navigation/native';
import CustomTextInput from '../../component/CustomTextInput';
import { appColors } from '../../component/Color';
import CustomHeader from '../../component/CustomHeader';
import { showMessage } from 'react-native-flash-message';
import { ProductListByPartURL } from '../../component/URL';
import UnifiedPDFService from '../../component/UnifiedPDFService';
import UnifiedPDFButton from '../../component/UnifiedPDFButton';

class SearchByPartScreen extends Component {
  static contextType = NavigationContext;

  constructor(props) {
    super(props);
    this.state = {
      input: '',
      loading: false,
      data: [],
      error: null,
      generatingPDF: false,
      pdfProgress: 0,
    };
    this.debounceTimer = null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.input !== this.state.input) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.state.input.trim() !== '') {
          this.fetchPartData();
        } else {
          this.setState({ data: [], error: null });
        }
      }, 500);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.debounceTimer);
  }

  fetchPartData = async () => {
    const { input } = this.state;
    if (input.trim() === '') return;

    this.setState({ loading: true, error: null, data: [] });

    try {
      const formData = new FormData();
      formData.append('part_no', input);

      const response = await axios.post(
        ProductListByPartURL,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status && response.data.products) {
        this.setState({ data: response.data.products });
      } else {
        this.setState({ error: 'No products found.' });
      }
    } catch (err) {
      this.setState({ error: 'Failed to fetch data. Please try again.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleInputChange = (input) => {
    this.setState({ input });
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
        'Part Search Results',
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
    const navigation = this.context;
    const { data } = this.state;
    const timestamp = Date.now();

    const imageUri = item.image_path
    ? `https://mtechsolution.org/${item.image_path}?t=${timestamp}`
    : 'https://via.placeholder.com/100';

    console.log("Image Path:", item.image_path, "Item name: ", item.sr_no);
    console.log("Final Image URI:", imageUri);
    
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ProductDetail', {
            product: item,
            products: data,
            index: data.findIndex((p) => p.id === item.id),
          })
        }
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
          />
        </View>
        <View style={styles.detailsContainer}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.title}>Part No. : </Text>
            <Text style={styles.value}>{item.sr_no}</Text>
          </View>
        
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.title}>Vehicle : </Text>
            <Text style={styles.value}>{item.vehicle}</Text>
          </View>
          <View style={{ flexDirection: 'row' ,flexWrap:'wrap'}}>
            <Text style={styles.title}>Description : </Text>
            <Text style={styles.value}>{item.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    const { input, data, loading, error, generatingPDF, pdfProgress } = this.state;

    return (
      <View style={styles.container}>
        <CustomHeader title="Search By UAW Parts Number" navigation={this.props.navigation} />
        <View style={styles.innerContainer}>
          <Text style={styles.label}>Enter UAW Parts No</Text>
          <CustomTextInput
            value={input}
            onChangeText={this.handleInputChange}
            placeholder="Type here..."
            placeholderTextColor="black"
          />

          {data.length > 0 && (
            <UnifiedPDFButton
              data={data}
              title="Generate PDF"
              searchQuery={input}
              onPress={this.createUnifiedPDF}
              generatingPDF={generatingPDF}
              pdfProgress={pdfProgress}
              disabled={data.length === 0}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {loading ? (
            <ActivityIndicator size="large" color="#00AEEF" />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={this.renderProductCard}
              contentContainerStyle={{
                paddingBottom: 10,
                flexGrow: 1
              }}
              ListEmptyComponent={
                !loading && input.trim() !== '' ? (
                  <Text style={styles.noData}>No products found.</Text>
                ) : null
              }
            />

          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.bgColor,
  },
  innerContainer: {
    padding: 20,
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
    marginBottom: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
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
    elevation: 2,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    backgroundColor: '#FFD580',
  },
  detailsContainer: {},
  title: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Bold',
  },
  value: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
    marginBottom: 8,
    width:"50%",
  },
});

export default SearchByPartScreen;
