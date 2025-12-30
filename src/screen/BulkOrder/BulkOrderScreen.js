import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTextInput from '../../component/CustomTextInput';
import CustomHeader from '../../component/CustomHeader';
import UnifiedPDFService from '../../component/UnifiedPDFService';
import UnifiedPDFButton from '../../component/UnifiedPDFButton';
import { appColors } from '../../component/Color';
import { ProductListByPartURL } from '../../component/URL';
import { showMessage } from 'react-native-flash-message';

class BulkOrder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            form: {
                customerName: '',
                billTo: '',
                shipTo: '',
                email: '',
            },
            input: '',
            loading: false,
            data: [],
            selectedProducts: [],
            error: null,
            userData: null,
            generatingPDF: false,
            isSubmit: false,
            pdfProgress: 0,
            showDialog: false,
            dialogProduct: null,
            dialogQuantity: "1",
        };
        this.debounceTimer = null;
    }

    componentDidMount() {
        this.getUserData();
    }

    componentWillUnmount() {
        clearTimeout(this.debounceTimer);
    }

    getUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsedData = JSON.parse(userData);
                this.setState({ userData: parsedData });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    handleChange = (name, value) => {
        this.setState(prevState => ({
            form: { ...prevState.form, [name]: value }
        }));
    };

    handleInputChange = (text) => {
        this.setState({ input: text });
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (text.trim() !== '') {
                this.fetchPartData(text);
            } else {
                this.setState({ data: [] });
            }
        }, 500);
    };

    fetchPartData = async (input) => {
        this.setState({
            loading: true,
            error: null,
            data: []
        });
        try {
            const formData = new FormData();
            formData.append('part_no', input);
            const response = await axios.post(
                ProductListByPartURL,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
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

    handleProductSelect = (product) => {
        this.setState({
            showDialog: true,
            dialogProduct: product,
            dialogQuantity: "1"
        });
    };

    confirmProductAdd = () => {
        const { dialogProduct, dialogQuantity, selectedProducts } = this.state;

        const qty = parseInt(dialogQuantity);
        if (!qty || qty <= 0) {
            alert("Please enter a valid quantity");
            return;
        }

        const already = selectedProducts.find(p => p.id === dialogProduct.id);

        let updatedList = [];

        if (already) {
            updatedList = selectedProducts.map(p =>
                p.id === dialogProduct.id ? { ...p, quantity: qty } : p
            );
        } else {
            updatedList = [...selectedProducts, { ...dialogProduct, quantity: qty }];
        }

        this.setState({
            selectedProducts: updatedList,
            showDialog: false,
            dialogProduct: null,
            dialogQuantity: "1",
            input: "",
            data: []
        });
    };


    // handleProductSelect = (product) => {
    //     this.setState(prevState => {
    //       const alreadySelected = prevState.selectedProducts.some(p => p.id === product.id);
    //       if (alreadySelected) {
    //         return {
    //           selectedProducts: prevState.selectedProducts.filter(p => p.id !== product.id)
    //         };
    //       } else {
    //         return {
    //           selectedProducts: [...prevState.selectedProducts, { ...product, quantity: 1 }]
    //         };
    //       }
    //     });
    //   };
      

      updateQuantity = (id, quantity) => {
        if (quantity < 0) return;
        this.setState(prevState => ({
          selectedProducts: prevState.selectedProducts.map(p =>
            p.id === id ? { ...p, quantity } : p
          )
        }));
      };
      
      removeProduct = (id) => {
        this.setState(prevState => ({
          selectedProducts: prevState.selectedProducts.filter(p => p.id !== id)
        }));
      };
      

    createUnifiedPDF = async () => {
        const { data } = this.state;
        if (!data || data.length === 0) {
            return;
        }
        this.setState({ generatingPDF: true, pdfProgress: 0 });
        try {
            const result = await UnifiedPDFService.createUnifiedPDF(
                data,
                'Bulk Order Products',
                '',
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

    renderProductCard = ({ item,index }) => (
        <TouchableOpacity
        onPress={() => this.handleProductSelect(item)}
        style={[styles.card, this.state.data.some(p => p.id === item.id) ? styles.selectedCard : {}]}
        >
            {/*<View style={{ marginRight: 10 }}>
                <Image
                    source={{
                        uri: item.image_path
                            ? `https://mtechsolution.org/${item.image_path}?t=${Date.now()}`
                            : 'https://via.placeholder.com/100',
                    }}
                    style={styles.image}
                />
            </View>*/}
                <View style= {styles.detailsContainer}>
                    <Text style={styles.title}>
                    UAW Serial No:  <Text style={styles.value}>{item.sr_no}</Text>
                    </Text>
                
                    <Text style={styles.title}>
                        Vehicle:  <Text style={styles.value}>{item.vehicle}</Text>
                    </Text>
                    <Text style={styles.title}>
                        Description:  <Text style={styles.value}>{item.description}</Text>
                    </Text>
                </View>
            
        </TouchableOpacity>
    );
    handleSubmit = async () => {
        this.setState({   isSubmit: true,})
        const { userData, selectedProducts, form } = this.state;
      
        const filteredData = selectedProducts.map(item => ({
          product_id: item.id,
          qty: item.quantity,
          other_details: JSON.stringify({ notes: "Handle With Care" })
        }));
      
        const orderData = {
          user_id: userData?.id,
          name: userData?.name,
          email: form?.email,
          phone: userData?.phone,
          city: userData?.city,
          address: 'N/A',
          type: 'bulk',
          shipped_to: form?.shipTo,
          shipped_address: form?.billTo,
          remark: '',
          status: 'Pending',
          payment_term: 'N/A',
          items: filteredData
        };
      
        try {
            const timestamp = Date.now();
          const response = await axios.post(
            'https://mtechsolution.org/api/v1/product/make-order',
            orderData,
            { headers: { 'Content-Type': 'application/json' } }
          );
          console.log("response",response)
        //   alert('Order placed successfully!');
          showMessage({
            message:"Order placed successfully!",
            position:'bottom',
            floating:true,
            type:'success',
            icon:'success',
          })
            this.setState({
                selectedProducts: [],
                isSubmit: false,
                form: {
                    customerName: '',
                    billTo: '',
                    shipTo: '',
                    email: '',
                },
            });
        } catch (error) {
            this.setState({   isSubmit: false,})
          console.error('Order Error:', error.response?.data || error.message);
          alert('Failed to place order.');
        }
      };
      

      render() {
        const { form, input, loading, data, error, generatingPDF, pdfProgress } = this.state;
        const { navigation } = this.props;
    
        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // adjust if header overlaps
            >
                <ScrollView
                    style={styles.container}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <CustomHeader title="Bulk Order" navigation={navigation} />
                    <View style={styles.innerContainer}>
    
                        {/* Customer Info Inputs */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Customer Name</Text>
                            <CustomTextInput
                                placeholder="Customer Name"
                                value={form.customerName}
                                onChangeText={text => this.handleChange('customerName', text)}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <CustomTextInput
                                placeholder="Enter email"
                                value={form.email}
                                onChangeText={text => this.handleChange('email', text)}
                                keyboardType="email-address"
                            />
                        </View>
    
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Address (Bill to)</Text>
                            <CustomTextInput
                                placeholder="Address (Bill to)"
                                value={form.billTo}
                                onChangeText={text => this.handleChange('billTo', text)}
                            />
                        </View>
    
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Address (Ship to)</Text>
                            <CustomTextInput
                                placeholder="Address (Ship to)"
                                value={form.shipTo}
                                onChangeText={text => this.handleChange('shipTo', text)}
                            />
                        </View>
    
                        {/* Search Part No */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Enter UAW Part No</Text>
                            <CustomTextInput
                                value={input}
                                onChangeText={this.handleInputChange}
                                placeholder="Type here..."
                                placeholderTextColor="black"
                            />
                        </View>
    
                        {data.length > 0 && (
                            <View style={styles.pdfButtonContainer}>
                                <UnifiedPDFButton
                                    data={data}
                                    title="Generate PDF"
                                    searchQuery={''}
                                    onPress={this.createUnifiedPDF}
                                    generatingPDF={generatingPDF}
                                    pdfProgress={pdfProgress}
                                    disabled={data.length === 0}
                                />
                            </View>
                        )}
    
                        {error && <Text style={styles.error}>{error}</Text>}
    
                        {loading ? (
                            <ActivityIndicator size="large" color="#ff9900" />
                        ) : (
                            <>
                                <FlatList
                                    data={data}
                                    keyExtractor={item => item.id.toString()}
                                    renderItem={this.renderProductCard}
                                    nestedScrollEnabled={true}
                                    scrollEnabled={false}
                                />
    
                                {/* Selected Products Table */}
                                {this.state.selectedProducts.length > 0 && (
                                    <View style={styles.selectedContainer}>
                                        <Text style={styles.header}>Selected Products:</Text>
                                        <View style={styles.tableContainer}>
                                            <View style={styles.tableRow}>
                                                <Text style={[styles.tableHeader, { flex: 1 }]}>Sr No</Text>
                                                <Text style={[styles.tableHeader, { flex: 3 }]}>Name</Text>
                                                <Text style={[styles.tableHeader, { flex: 2 }]}>Qty</Text>
                                                <Text style={[styles.tableHeader, { flex: 2 }]}>Actions</Text>
                                            </View>
    
                                            {this.state.selectedProducts.map(item => (
                                                <View key={item.id} style={styles.tableRow}>
                                                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.sr_no}</Text>
                                                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                                                    <View style={[styles.tableCell, { flex: 2 }]}>
                                                        <TextInput
                                                            style={styles.quantityInput}
                                                            keyboardType="numeric"
                                                            value={item.quantity?.toString()}
                                                            onChangeText={text =>
                                                                this.updateQuantity(item.id, parseInt(text) || 0)
                                                            }
                                                        />
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.deleteButton}
                                                        onPress={() => this.removeProduct(item.id)}
                                                    >
                                                        <Text style={styles.deleteText}>X</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
    
                                        <TouchableOpacity style={styles.button} onPress={this.handleSubmit}>
                                            <Text style={styles.buttonText}>{this.state.isSubmit?"Please Wait":"Submit"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
                {this.state.showDialog && this.state.dialogProduct && (
                    <View style={styles.dialogOverlay}>
                        <View style={styles.dialogBox}>
                            <Text style={styles.dialogTitle}>Set Quantity</Text>

                            <Image
                                source={{
                                    uri: `https://mtechsolution.org/${this.state.dialogProduct.image_path}`
                                }}
                                style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 10 }}
                            />

                            <Text style={styles.dialogText}>
                                <Text style={{ fontWeight: "bold" }}>Sr No: </Text>
                                {this.state.dialogProduct.sr_no}
                            </Text>

                            <Text style={styles.dialogText}>
                                <Text style={{ fontWeight: "bold" }}>Vehicle: </Text>
                                {this.state.dialogProduct.vehicle}
                            </Text>

                            <Text style={styles.dialogText}>
                                <Text style={{ fontWeight: "bold" }}>Description: </Text>
                                {this.state.dialogProduct.description}
                            </Text>

                            <TextInput
                                style={styles.dialogInput}
                                keyboardType="numeric"
                                value={this.state.dialogQuantity}
                                onChangeText={(t) => this.setState({ dialogQuantity: t })}
                                placeholder="Enter Qty"
                            />

                            <View style={styles.dialogButtons}>
                                <TouchableOpacity
                                    onPress={() => this.setState({ showDialog: false })}
                                    style={[styles.dialogBtn, { backgroundColor: "#aaa" }]}
                                >
                                    <Text style={styles.dialogBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={this.confirmProductAdd}
                                    style={[styles.dialogBtn, { backgroundColor: "#ff9900" }]}
                                >
                                    <Text style={styles.dialogBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        );
    }
    
}

export default BulkOrder;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appColors.bgColor,
    },
    innerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 10,
    },
    inputContainer: {
        marginBottom: 15
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
        color: '#333'
    },
    dialogOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },

    dialogBox: {
        width: "85%",
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        elevation: 6,
    },

    dialogTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },

    dialogText: {
        fontSize: 14,
        marginBottom: 5,
        color: "#333",
    },

    dialogInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        marginBottom: 20,
        textAlign: "center",
        fontSize: 16,
    },

    dialogButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    dialogBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: "45%",
        alignItems: "center",
    },

    dialogBtnText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    pdfButtonContainer: {
        marginVertical: 15,
        paddingHorizontal: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFD580',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedCard: {
        backgroundColor: appColors.white,
        borderWidth: 2,
        borderColor: '#ff9900',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        resizeMode: 'cover'
    },
    detailsContainer: {
        flex: 1,
        //flexDirection: "row",
        justifyContent: 'center',
        paddingLeft: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'normal',
        color: 'black',
        marginBottom: 2,
        marginRight: 5,
        marginBottom: 8,
        marginTop: 5,
    },
    value: {
        fontSize: 18,
        color: 'black',
        fontWeight: 'normal',
        fontWeight: 'bold'
    },
    selectedContainer: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 15,
        marginTop: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    noData: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic'
    },
    tableContainer: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        alignItems: 'center',
        minHeight: 50,
    },
    tableHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        padding: 10,
        textAlign: 'left',
        backgroundColor: '#ffcc00',
        color: '#333',
    },
    tableCell: {
        fontSize: 10,
        paddingVertical: 8,
        paddingHorizontal: 2,
        textAlign: 'left',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        textAlign: 'center',
        borderRadius: 5,
        fontSize: 16,
        backgroundColor: '#fff',
        alignSelf:'flex-start'
    },
    deleteButton: {
        backgroundColor: 'red',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf:'center',
        marginEnd:5
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    button: {
        backgroundColor:appColors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 60,
      },
      
      buttonText: {
        color: appColors.white,
        fontSize: 18,
        fontFamily: 'Exo2-Bold',
      },
});