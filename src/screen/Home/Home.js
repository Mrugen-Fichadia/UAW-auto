import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { appColors } from '../../component/Color';
import Carousel from '../../component/Carousel';
import axios from 'axios';
import { homeScreenBanner } from '../../component/URL';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const NEW_PRODUCTS_PDF_URL = "https://mtechsolution.org/uploads/new_products.pdf";
const LIST_PDF_URL = "https://mtechsolution.org/catalogues/list.php";

const LOCAL_FOLDER = "https://mtechsolution.org/catalogues/local/";
const INTERNATIONAL_FOLDER = "https://mtechsolution.org/catalogues/international/";


export default class Home extends Component {
  state = {
    isModalVisible: false,
    image: [],
    userName: '',
  };

  fetchPDFFiles = async () => {
    try {
      const response = await axios.get(LIST_PDF_URL);
      return response.data;
    } catch (error) {
      console.log("Error fetching pdf list:", error);
      Alert.alert("Error", "Unable to fetch PDF list");
      return null;
    }
  };

  downloadSinglePDF = async (url, fileName) => {
    try {
      const path =
        Platform.OS === "android"
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: path,
      }).promise;

      if (result.statusCode === 200) {
        console.log("Downloaded:", path);
      } else {
        throw new Error("Download failed");
      }
    } catch (e) {
      console.log("Error downloading:", fileName, e);
    }
  };

  downloadAllPdfs = async (type) => {
    const pdfList = await this.fetchPDFFiles();
    if (!pdfList) return;

    const files = type === "local" ? pdfList.local : pdfList.international;
    const baseURL = type === "local" ? LOCAL_FOLDER : INTERNATIONAL_FOLDER;

    for (let file of files) {
      await this.downloadSinglePDF(baseURL + file, file);
    }

    Alert.alert(
      "Download Complete",
      Platform.OS === "android"
        ? "All catalogues downloaded in Downloads folder"
        : "All catalogues saved inside the app storage"
    );
  };


  downloadPDF = async (url, fileName) => {
    try {
      //const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
      const filePath =
        Platform.OS === "android"
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
      }).promise;

      Alert.alert(
      "Download Completed",
      Platform.OS === "android"
        ? `File saved to Downloads folder as "${fileName}.pdf"`
        : `File saved inside the app storage as "${fileName}.pdf"`
    );

      //Alert.alert('Download Completed', `File saved to Downloads folder as "${fileName}.pdf"`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Could not download PDF file.');
    }
  };

  async componentDidMount() {
    this.fetchBannerData();
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData !== null) {
        const parsedData = JSON.parse(userData);
        this.setState({ userName: parsedData.name });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  fetchBannerData = async () => {
    try {
      const response = await axios.get(homeScreenBanner);
      if (response.data?.status) {
        const banners = response.data.banners.map((item) => ({
          uri: `https://mtechsolution.org/${item.image_path}`,
          link: item.link,
        }));
        this.setState({ image: banners });
      }
    } catch (error) {
      console.error('Banner API error:', error);
    }
  };

  cards = [
    {
      title: 'Search By Category',
      icon: 'cog-outline',
      bg: '#FFFFFF',
      color: "#000000",
      screen: 'SearchByCategoryScreen',
    },
    {
      title: 'Search By Vehicle',
      icon: null,
      customIcon: () => (
        <View style={{ position: 'relative', width: 50, height: 40, marginBottom: 15 }}>
          <Ionicons
            name="bus-outline"
            size={55}
            color="#000000"
            style={{
              position: 'absolute',
              top: 0,
              left: 1,
              backgroundColor: appColors.primary,
              borderRadius: 100
            }}
          />
          <Icon
            name="car-outline"
            size={38}
            color="#000000"
            style={{
              position: 'absolute',
              bottom: -18,
              right: -12,
              backgroundColor: appColors.primary,
            }}
          />
        </View>
      ),
      bg: appColors.primary,
      color: "#000000",
      screen: 'SearchByVehicleScreen',
    },
    {
      title: 'Search By Product',
      icon: 'clipboard-text-search-outline',
      bg: appColors.primary,
      color: "#000000",
      screen: 'SearchByProductNameScreen',
    },
    {
      title: 'Search by UAW Parts Number',
      icon: 'magnify',
      bg: '#FFFFFF',
      color: "#000000",
      screen: 'SearchByPartScreen',
    },
    {
      title: 'Contacts Us',
      icon: 'phone-outline',
      bg: '#FFFFFF',
      color: "#000000",
      screen: 'ContactUs',
    },
    {
      title: 'Bulk Order',
      icon: 'shopping-outline',
      bg: appColors.primary,
      color: '#000000',
      screen: 'BulkOrderScreen',
    },
    {
      title: 'Download New Products PDF',
      icon: 'file-download-outline',
      bg: appColors.primary,
      color: '#000000',
      func: () => this.downloadPDF(NEW_PRODUCTS_PDF_URL, "New_Products"),
    },
    {
      title: 'Download Catalouge',
      icon: 'file-multiple-outline',
      bg: '#FFFFFF',
      color: "#000000",
      func: () => this.setState({ isModalVisible: true }),
    }
  ];

  handleCardPress = (item) => {
    if (item.screen) {
      this.props.navigation.navigate(item.screen);
    } else if (item.func) {
      item.func();
    } else {
      alert(`No screen defined for: ${item.title}`);
    }
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headText}>Welcome, {this.state.userName}</Text>

        {/* Banners */}
        <View style={styles.sliderContainer}>
          <Carousel data={this.state.image} slideInterval={2000} />
        </View>

        {/* DOWNLOAD PDF BUTTON */}
        {/* <View style={{ marginBottom: 20}}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => this.downloadPDF(NEW_PRODUCTS_PDF_URL, "New_Products")}
          >
            <Text style={styles.downloadBtnText}>Download New Products PDF</Text>
          </TouchableOpacity>
      </View> */}
      
      {/* <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => this.setState({ isModalVisible: true })}
          >
            <Text style={styles.downloadBtnText}>Download Catalouge</Text>
          </TouchableOpacity>
        </View> */}

        {/* Cards */}
        <View style={styles.cardContainer}>
          {this.cards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: item.bg }]}
              onPress={() => this.handleCardPress(item)}
            >
              {item.customIcon ? item.customIcon() : <Icon name={item.icon} size={60} color={item.color} />}
              <Text style={[styles.cardText, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MODAL */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={this.state.isModalVisible}
          onRequestClose={() => this.setState({ isModalVisible: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select PDF Type</Text>

              <TouchableOpacity
                style={styles.modalCard}
                onPress={() => {
                  this.setState({ isModalVisible: false });
                  this.downloadAllPdfs("local");
                }}
              >
                <Icon name="file-pdf-box" size={30} color={appColors.primary} />
                <Text style={styles.modalCardText}>Local Catalouge</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCard}
                onPress={() => {
                  this.setState({ isModalVisible: false });
                  this.downloadAllPdfs("international");
                }}
              >
                <Icon name="earth" size={30} color={appColors.primary} />
                <Text style={styles.modalCardText}>International Catalouge</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtnFull}
                onPress={() => this.setState({ isModalVisible: false })}
              >
                <Text style={styles.closeTextFull}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 100,
    backgroundColor: '#FFFFFF',
  },
  sliderContainer: {
    paddingTop: 5,
    marginBottom: 20,
  },
  downloadBtn: {
    backgroundColor: appColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadBtnText: {
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
    color: '#000',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 60) / 2,
    height: 175,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    borderColor: appColors.primary,
    borderWidth: 1.2,
  },
  cardText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: 'Exo2-Bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  modalCardText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtnFull: {
    marginTop: 10,
    backgroundColor: appColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeTextFull: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headText: {
    fontFamily: 'Exo2-Bold',
    color: appColors.primary,
    fontSize: 18,
    padding: 5,
    marginTop: 10,
  },
});
