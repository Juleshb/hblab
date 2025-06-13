import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 60,
    alignItems: "center",
    justifyContent: "center"
  },
  certificateTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center"
  },
  certificateSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    textDecoration: "underline",
    textDecorationThickness: 1
  },
  presentedText: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center"
  },
  recipientName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    textDecoration: "underline",
    textDecorationThickness: 1
  },
  bodyText: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 1.5
  },
  skillsTitle: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold"
  },
  skillsList: {
    fontSize: 12,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 1.5
  },
  dateText: {
    fontSize: 14,
    marginBottom: 40,
    textAlign: "center"
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20
  },
  signatureBlock: {
    width: "45%",
    marginTop: 30
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "black",
    width: "80%",
    marginBottom: 5
  },
  signatureText: {
    fontSize: 12,
    marginTop: 5
  }
});

const CertificatePDF = ({ certificate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.certificateTitle}>CERTIFICATE</Text>
      <Text style={styles.certificateSubtitle}>&mdash; PARTICIPATION &mdash;</Text>
      
      <Text style={styles.presentedText}>THIS CERTIFICATE IS PROUDLY PRESENTED TO</Text>
      
      <Text style={styles.recipientName}>{certificate.recipientName}</Text>
      
      <Text style={styles.bodyText}>
        has successfully completed {certificate.duration} HB-LAB training in {certificate.courseName} from {certificate.dateRange}.
      </Text>
      
      <Text style={styles.skillsTitle}>Content of the Training were:</Text>
      <Text style={styles.skillsList}>
        {certificate.skills.join(",\n")}
      </Text>
      
      <Text style={styles.dateText}>Date: {new Date(certificate.completionDate).toLocaleDateString('en-GB').replace(/\//g, ' / ')}</Text>
      
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Mr. KWIZERA Ferdnard</Text>
          <Text style={styles.signatureText}>(Training Coordinator HB-LAB)</Text>
        </View>
        
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Mr. HABARUREMA Jules</Text>
          <Text style={styles.signatureText}>(CEO HB-LAB)</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default CertificatePDF;